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
import { sha1 } from '../crypto/mtproto.js'
import { rsaEncrypt, SERVER_PUBLIC_KEYS, modPow } from '../crypto/rsa.js'
import { factorizePQ, CURRENT_DH_PRIME } from '../crypto/prime.js'
import { ige256Encrypt, ige256Decrypt } from '../crypto/aes.js'
import { SecurityCheckMismatch } from '../errors/index.js'
import { Connection } from '../connection/index.js'
import { BinaryReader, TLObject } from '../raw/index.js'
import { ReqPqMulti, ReqDHParams, SetClientDHParams } from '../raw/functions/index.js'
import {
  ResPQ,
  ServerDHParamsOk,
  DhGenOk,
  PQInnerData,
  ClientDHInnerData,
  ServerDHInnerData
} from '../raw/types/index.js'
import { AuthKey } from './AuthKey.js'

export interface HandshakeResult {
  authKey: AuthKey
  serverSalt: bigint
}

/**
 * Performs unencrypted MTProto Diffie-Hellman AuthKey Handshake exchange with a Telegram DC.
 */
export class Handshake {
  private readonly connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
  }

  private packUnencrypted(payload: TLObject): Buffer {
    const data = payload.write()
    const msgId = (BigInt(Math.floor(Date.now() / 1000)) * (1n << 32n)) & ~0b11n
    const header = Buffer.alloc(20)
    header.writeBigInt64LE(0n, 0) // auth_key_id = 0
    header.writeBigInt64LE(msgId, 8)
    header.writeUInt32LE(data.length, 16)
    return Buffer.concat([header, data])
  }

  private unpackUnencrypted(chunk: Buffer): TLObject {
    const reader = new BinaryReader(chunk)
    reader.readInt64() // auth_key_id
    reader.readInt64() // msg_id
    reader.readInt32() // msg_len
    return TLObject.read(reader)
  }

  private async invoke(payload: TLObject): Promise<TLObject> {
    const packed = this.packUnencrypted(payload)

    const payloadPromise = new Promise<Buffer>((resolve) => {
      this.connection.once('payload', (data) => resolve(data))
    })

    await this.connection.send(packed)
    const response = await payloadPromise
    return this.unpackUnencrypted(response)
  }

  /**
   * Execute 9-step MTProto AuthKey Handshake exchange.
   */
  public async execute(): Promise<HandshakeResult> {
    // Step 1 & 2: req_pq_multi -> resPQ
    const nonce = randomBytes(16)
    const resPq = (await this.invoke(new ReqPqMulti(nonce))) as ResPQ

    let publicKeyFingerprint: bigint | null = null
    for (const fp of resPq.server_public_key_fingerprints) {
      if (SERVER_PUBLIC_KEYS.has(fp)) {
        publicKeyFingerprint = fp
        break
      }
    }

    if (publicKeyFingerprint === null) {
      throw new Error('Handshake failed: server public key fingerprint not found')
    }

    // Step 3: PQ Factorization
    const { p, q } = factorizePQ(resPq.pq)

    // Step 4: Encrypt PQInnerData with RSA
    const serverNonce = resPq.server_nonce
    const newNonce = randomBytes(32)

    const pBytes = Buffer.alloc(4)
    pBytes.writeUInt32BE(Number(p), 0)

    const qBytes = Buffer.alloc(4)
    qBytes.writeUInt32BE(Number(q), 0)

    const pqInner = new PQInnerData(
      resPq.pq,
      pBytes,
      qBytes,
      resPq.nonce,
      serverNonce,
      newNonce
    )

    const innerData = pqInner.write()
    const innerHash = sha1(innerData)
    const padLen = (- (innerData.length + innerHash.length) % 255 + 255) % 255
    const innerPadding = randomBytes(padLen)

    const dataWithHash = Buffer.concat([innerHash, innerData, innerPadding])
    const encryptedData = rsaEncrypt(dataWithHash, publicKeyFingerprint)

    // Step 5: req_DH_params -> ServerDHParamsOk
    const serverDhParams = (await this.invoke(
      new ReqDHParams(
        resPq.nonce,
        serverNonce,
        pBytes,
        qBytes,
        publicKeyFingerprint,
        encryptedData
      )
    )) as ServerDHParamsOk

    // Derive temporary AES key and IV for DH params decryption
    const tmpAesKey = Buffer.concat([
      sha1(Buffer.concat([newNonce, serverNonce])),
      sha1(Buffer.concat([serverNonce, newNonce])).subarray(0, 12),
    ])

    const tmpAesIv = Buffer.concat([
      sha1(Buffer.concat([serverNonce, newNonce])).subarray(12, 20),
      sha1(Buffer.concat([newNonce, newNonce])),
      newNonce.subarray(0, 4),
    ])

    const decryptedAnswer = ige256Decrypt(serverDhParams.encrypted_answer, tmpAesKey, tmpAesIv)
    const answerReader = new BinaryReader(decryptedAnswer.subarray(20))
    const serverDhInner = TLObject.read(answerReader) as ServerDHInnerData

    const dhPrime = BigInt('0x' + serverDhInner.dh_prime.toString('hex'))
    const g = BigInt(serverDhInner.g)
    const gA = BigInt('0x' + serverDhInner.g_a.toString('hex'))

    // Security Checks
    if (dhPrime !== CURRENT_DH_PRIME) {
      throw new SecurityCheckMismatch('Handshake failed: DH prime mismatch')
    }

    // Step 6: Client DH Params
    const b = BigInt('0x' + randomBytes(256).toString('hex'))
    const gBVal = modPow(g, b, dhPrime)
    let gBHex = gBVal.toString(16)
    if (gBHex.length % 2 !== 0) gBHex = '0' + gBHex
    const gB = Buffer.from(gBHex.padStart(512, '0'), 'hex')

    const clientDhInner = new ClientDHInnerData(
      resPq.nonce,
      serverNonce,
      0n,
      gB
    )

    const clientData = clientDhInner.write()
    const clientHash = sha1(clientData)
    const clientPadLen = (- (clientData.length + clientHash.length) % 16 + 16) % 16
    const clientPadding = randomBytes(clientPadLen)

    const encryptedClientData = ige256Encrypt(
      Buffer.concat([clientHash, clientData, clientPadding]),
      tmpAesKey,
      tmpAesIv
    )

    // Step 7 & 8: set_client_DH_params -> DhGenOk
    const dhRes = (await this.invoke(
      new SetClientDHParams(
        resPq.nonce,
        serverNonce,
        encryptedClientData
      )
    )) as DhGenOk

    // Calculate Shared Secret AuthKey = (g_a ** b) % dh_prime
    const authKeyVal = modPow(gA, b, dhPrime)
    let authKeyHex = authKeyVal.toString(16)
    if (authKeyHex.length % 2 !== 0) authKeyHex = '0' + authKeyHex
    const authKeyBytes = Buffer.from(authKeyHex.padStart(512, '0'), 'hex')

    const authKey = new AuthKey(authKeyBytes)

    // Calculate Server Salt = XOR(newNonce[0:8], serverNonce[0:8])
    const serverSalt = newNonce.subarray(0, 8).readBigUInt64LE(0) ^ serverNonce.subarray(0, 8).readBigUInt64LE(0)

    return { authKey, serverSalt }
  }
}
