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

import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { Storage, PeerInfo } from './Storage.js'
import { AuthKey } from '../session/AuthKey.js'

export class FileStorage extends Storage {
  public readonly filePath: string
  private _dcId: number = 2
  private _apiId: number = 0
  private _testMode: boolean = false
  private _authKey: AuthKey | null = null
  private _userId: bigint | null = null
  private _isBot: boolean = false

  private readonly _peersById: Map<bigint, PeerInfo> = new Map()

  constructor(filePath: string) {
    super()
    this.filePath = resolve(filePath.endsWith('.session') ? filePath : `${filePath}.session`)
  }

  public override async open(): Promise<void> {
    try {
      const data = await readFile(this.filePath, 'utf8')
      const json = JSON.parse(data)

      this._dcId = json.dcId ?? 2
      this._apiId = json.apiId ?? 0
      this._testMode = json.testMode ?? false
      this._isBot = json.isBot ?? false
      this._userId = json.userId ? BigInt(json.userId) : null

      if (json.authKeyHex) {
        this._authKey = new AuthKey(Buffer.from(json.authKeyHex, 'hex'))
      }

      if (Array.isArray(json.peers)) {
        for (const p of json.peers) {
          const peer: PeerInfo = {
            id: BigInt(p.id),
            accessHash: BigInt(p.accessHash),
            type: p.type,
            username: p.username,
            phone: p.phone,
          }
          this._peersById.set(peer.id, peer)
        }
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
  }

  public override async save(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })

    const peersArray = Array.from(this._peersById.values()).map((p) => ({
      id: p.id.toString(),
      accessHash: p.accessHash.toString(),
      type: p.type,
      username: p.username,
      phone: p.phone,
    }))

    const json = {
      dcId: this._dcId,
      apiId: this._apiId,
      testMode: this._testMode,
      isBot: this._isBot,
      userId: this._userId ? this._userId.toString() : null,
      authKeyHex: this._authKey ? this._authKey.key.toString('hex') : null,
      peers: peersArray,
    }

    await writeFile(this.filePath, JSON.stringify(json, null, 2), 'utf8')
  }

  public override async close(): Promise<void> {
    await this.save()
  }

  public override async delete(): Promise<void> {
    try {
      await unlink(this.filePath)
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err
    }
    this._authKey = null
    this._userId = null
    this._peersById.clear()
  }

  public override async getDcId(): Promise<number> { return this._dcId }
  public override async setDcId(val: number): Promise<void> { this._dcId = val; await this.save() }

  public override async getApiId(): Promise<number> { return this._apiId }
  public override async setApiId(val: number): Promise<void> { this._apiId = val; await this.save() }

  public override async getTestMode(): Promise<boolean> { return this._testMode }
  public override async setTestMode(val: boolean): Promise<void> { this._testMode = val; await this.save() }

  public override async getAuthKey(): Promise<AuthKey | null> { return this._authKey }
  public override async setAuthKey(val: AuthKey | null): Promise<void> { this._authKey = val; await this.save() }

  public override async getUserId(): Promise<bigint | null> { return this._userId }
  public override async setUserId(val: bigint | null): Promise<void> { this._userId = val; await this.save() }

  public override async getIsBot(): Promise<boolean> { return this._isBot }
  public override async setIsBot(val: boolean): Promise<void> { this._isBot = val; await this.save() }

  public override async updatePeer(peer: PeerInfo): Promise<void> {
    this._peersById.set(peer.id, peer)
    await this.save()
  }

  public override async getPeerById(id: bigint): Promise<PeerInfo | null> {
    return this._peersById.get(id) ?? null
  }

  public override async getPeerByUsername(username: string): Promise<PeerInfo | null> {
    const target = username.toLowerCase()
    for (const peer of this._peersById.values()) {
      if (peer.username && peer.username.toLowerCase() === target) {
        return peer
      }
    }
    return null
  }

  public override async getPeerByPhone(phone: string): Promise<PeerInfo | null> {
    for (const peer of this._peersById.values()) {
      if (peer.phone && peer.phone === phone) {
        return peer
      }
    }
    return null
  }
}
