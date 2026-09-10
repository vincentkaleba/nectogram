//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//
//  This file is part of Nectogram.
//
//  Nectogram is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Lesser General Public License as published
//  by the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  Nectogram is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Lesser General Public License for more details.
//
//  You should have received a copy of the GNU Lesser General Public License
//  along with Nectogram.  If not, see <http://www.gnu.org/licenses/>.

import { randomBytes } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { sha256, kdf } from '../crypto/mtproto.js'
import { ige256Encrypt, ige256Decrypt } from '../crypto/aes.js'
import { SecurityCheckMismatch, raise_it } from '../errors/index.js'
import { Connection } from '../connection/index.js'
import { BinaryReader, BinaryWriter, TLObject, Message, MsgContainer, GzipPacked } from '../raw/index.js'
import { Ping } from '../raw/functions/ping.js'
import { PingDelayDisconnect } from '../raw/functions/ping_delay_disconnect.js'
import { AuthKey } from './AuthKey.js'

export interface PendingRequest {
  msgId: bigint
  resolve: (value: any) => void
  reject: (reason: any) => void
}

/**
 * Manages an encrypted MTProto 2.0 session over a Connection.
 */
export class Session extends EventEmitter {
  public readonly authKey: AuthKey
  public readonly sessionIdBuffer: Buffer
  public readonly sessionId: bigint
  public salt: bigint
  public seqNo: number = 0

  private readonly connection: Connection
  private _lastMsgId: bigint = 0n
  private readonly _pendingRequests: Map<bigint, PendingRequest> = new Map()
  private _onPayloadBound: (payload: Buffer) => void
  private _pingTimer: NodeJS.Timeout | null = null

  constructor(connection: Connection, authKey: AuthKey, salt: bigint = 0n) {
    super()
    this.connection = connection
    this.authKey = authKey
    this.salt = salt

    this.sessionIdBuffer = randomBytes(8)
    this.sessionId = this.sessionIdBuffer.readBigUInt64LE(0)

    this._onPayloadBound = (chunk: Buffer) => {
      try {
        this.onEncryptedPayload(chunk)
      } catch (err) {
        this.emit('error', err)
      }
    }
  }

  public get isConnected(): boolean {
    return this.connection.isConnected
  }

  public async connect(): Promise<void> {
    this.connection.on('payload', this._onPayloadBound)
    if (!this.connection.isConnected) {
      await this.connection.connect()
    }
  }

  public startPingLoop(): void {
    if (this._pingTimer) return
    this._pingTimer = setInterval(async () => {
      if (!this.connection.isConnected) return
      try {
        await this.send(new PingDelayDisconnect(0n, 25))
      } catch {
        // Ignore ping loop error
      }
    }, 5000)
  }

  public stopPingLoop(): void {
    if (this._pingTimer) {
      clearInterval(this._pingTimer)
      this._pingTimer = null
    }
  }

  public async start(): Promise<void> {
    await this.connect()
    try {
      await this.send(new Ping(0n))
    } catch {
      // Ignore ping error if any
    }
    this.startPingLoop()
  }

  public async stop(): Promise<void> {
    this.stopPingLoop()
    this.close()
  }

  public async invoke<T = any>(query: TLObject, _retries: number = 3): Promise<T> {
    return await this.send<T>(query)
  }

  /**
   * Generates a strictly monotonic client message ID (divisible by 4).
   */
  public getNewMessageId(): bigint {
    const now = Math.floor(Date.now() / 1000)
    let msgId = (BigInt(now) * (1n << 32n)) & ~0b11n

    if (msgId <= this._lastMsgId) {
      msgId = this._lastMsgId + 4n
    }

    this._lastMsgId = msgId
    return msgId
  }

  /**
   * Encapsulate a Message object into an encrypted MTProto v2.0 envelope.
   */
  public pack(message: Message, outgoing: boolean = true): Buffer {
    const writer = new BinaryWriter()
    writer.writeInt64(this.salt)
    writer.writeInt64(this.sessionId)
    writer.write(message.write())

    const data = writer.toBuffer()
    const padLen = (- (data.length + 12) % 16 + 16) % 16 + 12
    const padding = randomBytes(padLen)

    // MTProto v2.0 msg_key calculation (outgoing x = 0, incoming x = 8)
    const x = outgoing ? 0 : 8
    const msgKeyLarge = sha256(Buffer.concat([this.authKey.key.subarray(88 + x, 88 + x + 32), data, padding]))
    const msgKey = Buffer.from(msgKeyLarge.subarray(8, 24))

    const { key, iv } = kdf(this.authKey.key, msgKey, outgoing)
    const encryptedPayload = ige256Encrypt(Buffer.concat([data, padding]), key, iv)

    return Buffer.concat([this.authKey.keyIdBuffer, msgKey, encryptedPayload])
  }

  /**
   * Unpack an encrypted MTProto v2.0 envelope into a Message object.
   */
  public unpack(chunk: Buffer): Message {
    if (chunk.length < 24) {
      throw new Error(`Session unpack: chunk length too small (${chunk.length})`)
    }

    const recvKeyId = chunk.subarray(0, 8)
    if (!recvKeyId.equals(this.authKey.keyIdBuffer)) {
      throw new SecurityCheckMismatch('Session unpack: authKeyId mismatch')
    }

    const msgKey = chunk.subarray(8, 24)
    const { key, iv } = kdf(this.authKey.key, msgKey, false)

    const decrypted = ige256Decrypt(chunk.subarray(24), key, iv)
    const salt = decrypted.subarray(0, 8).readBigUInt64LE(0)
    const recvSessionId = decrypted.subarray(8, 16)

    if (!recvSessionId.equals(this.sessionIdBuffer)) {
      throw new SecurityCheckMismatch('Session unpack: sessionId mismatch')
    }

    // Verify incoming msg_key Security Check (incoming x = 8 -> 96:128)
    const expectedMsgKeyLarge = sha256(Buffer.concat([this.authKey.key.subarray(96, 128), decrypted]))
    const expectedMsgKey = expectedMsgKeyLarge.subarray(8, 24)
    if (!msgKey.equals(expectedMsgKey)) {
      throw new SecurityCheckMismatch('Session unpack: msg_key verification failed')
    }

    this.salt = salt
    const reader = new BinaryReader(decrypted.subarray(16))
    return Message.read(reader)
  }

  /**
   * Send a TLObject RPC request over the encrypted session and wait for response.
   */
  public async send<T = any>(query: TLObject): Promise<T> {
    const msgId = this.getNewMessageId()
    const seqNo = this.seqNo * 2 + 1
    this.seqNo++

    const message = new Message(query, msgId, seqNo, query.write().length)
    const packed = this.pack(message)

    return new Promise<T>((resolve, reject) => {
      this._pendingRequests.set(msgId, {
        msgId,
        resolve: (result: any) => {
          if (result && (result.CONSTRUCTOR_ID === 0xedab447b || result.QUALNAME === 'types.BadServerSalt')) {
            this.salt = result.new_server_salt ?? result.newServerSalt
            this.send<T>(query).then(resolve, reject)
          } else {
            resolve(result)
          }
        },
        reject,
      })
      this.connection.send(packed).catch((err) => {
        this._pendingRequests.delete(msgId)
        reject(err)
      })
    })
  }

  /**
   * Handle incoming raw encrypted payload from Connection.
   */
  private onEncryptedPayload(chunk: Buffer): void {
    const message = this.unpack(chunk)
    this.handleMessage(message.body, message.msgId)
  }

  private handleMessage(body: TLObject, msgId: bigint): void {
    if (body instanceof MsgContainer) {
      for (const msg of body.messages) {
        this.handleMessage(msg.body, msg.msgId)
      }
      return
    }

    if (body instanceof GzipPacked) {
      this.handleMessage(body.packedData, msgId)
      return
    }

    const cId = (body as any).CONSTRUCTOR_ID ?? (body.constructor as any).ID

    // Handle NewSessionCreated (0x9ec20908)
    if (cId === 0x9ec20908) {
      const serverSalt = (body as any).server_salt ?? (body as any).serverSalt
      if (serverSalt !== undefined) {
        this.salt = serverSalt
      }
      return
    }

    // Handle BadServerSalt (0xedab447b)
    if (cId === 0xedab447b) {
      const badMsgId = (body as any).bad_msg_id ?? (body as any).badMsgId
      const newSalt = (body as any).new_server_salt ?? (body as any).newServerSalt
      if (newSalt !== undefined) {
        this.salt = newSalt
      }
      const pending = this._pendingRequests.get(badMsgId)
      if (pending) {
        this._pendingRequests.delete(badMsgId)
        pending.resolve(body)
      }
      return
    }

    // Handle BadMsgNotification (0xa7eff811)
    if (cId === 0xa7eff811) {
      const badMsgId = (body as any).bad_msg_id ?? (body as any).badMsgId
      const errorCode = (body as any).error_code ?? (body as any).errorCode
      const pending = this._pendingRequests.get(badMsgId)
      if (pending) {
        this._pendingRequests.delete(badMsgId)
        pending.reject(new Error(`MTProto BadMsgNotification: error_code=${errorCode}`))
      }
      return
    }

    // Handle Pong (0x347773c5)
    if (cId === 0x347773c5) {
      const reqMsgId = (body as any).msg_id ?? (body as any).msgId
      const pending = this._pendingRequests.get(reqMsgId)
      if (pending) {
        this._pendingRequests.delete(reqMsgId)
        pending.resolve(body)
      }
      return
    }

    // Handle RPC Result (0xf35c6d01)
    if (cId === 0xf35c6d01) {
      const reqMsgId = (body as any).req_msg_id ?? (body as any).reqMsgId
      const result = (body as any).result
      const pending = this._pendingRequests.get(reqMsgId)

      if (pending) {
        this._pendingRequests.delete(reqMsgId)
        const resCId = result ? ((result as any).CONSTRUCTOR_ID ?? (result.constructor as any).ID) : undefined
        // Check if result is an RPC error constructor (0x2144ca19)
        if (resCId === 0x2144ca19) {
          const errCode = result.error_code ?? result.errorCode
          const errMsg = result.error_message ?? result.errorMessage
          try {
            raise_it(errCode, errMsg)
          } catch (err) {
            pending.reject(err)
          }
        } else {
          pending.resolve(result)
        }
      }
      return
    }

    // Handle Updates containers (types.Updates, types.UpdatesCombined, etc.)
    if (Array.isArray((body as any).updates)) {
      const usersMap = new Map<bigint, any>()
      const chatsMap = new Map<bigint, any>()
      if (Array.isArray((body as any).users)) {
        for (const u of (body as any).users) {
          if (u && u.id !== undefined) usersMap.set(BigInt(u.id), u)
        }
      }
      if (Array.isArray((body as any).chats)) {
        for (const c of (body as any).chats) {
          if (c && c.id !== undefined) chatsMap.set(BigInt(c.id), c)
        }
      }
      for (const u of (body as any).updates) {
        this.emit('update', u, usersMap, chatsMap)
      }
      return
    }

    // Handle UpdateShort
    if ((body as any).update) {
      this.emit('update', (body as any).update, new Map(), new Map())
      return
    }

    this.emit('update', body, new Map(), new Map())
    this.emit('message', body, msgId)
  }

  public close(): void {
    this.connection.removeListener('payload', this._onPayloadBound)
    this.connection.close()
    for (const pending of this._pendingRequests.values()) {
      pending.reject(new Error('Session closed'))
    }
    this._pendingRequests.clear()
  }
}
