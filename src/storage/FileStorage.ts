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

import { readFile, writeFile, unlink, mkdir, rename, chmod } from 'node:fs/promises'
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

  private _dirty: boolean = false
  private _saveTimer: NodeJS.Timeout | null = null
  private _isSaving: boolean = false

  constructor(filePath: string) {
    super()
    this.filePath = resolve(filePath.endsWith('.session') ? filePath : `${filePath}.session`)
  }

  private _opened: boolean = false

  public override async open(): Promise<void> {
    if (this._opened) return
    this._opened = true

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

  /**
   * Performs an atomic save operation to disk using a temporary file and atomic rename.
   */
  public override async save(): Promise<void> {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer)
      this._saveTimer = null
    }

    if (this._isSaving) {
      this._dirty = true
      return
    }

    this._isSaving = true
    this._dirty = false

    try {
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

      const tempPath = `${this.filePath}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      await writeFile(tempPath, JSON.stringify(json, null, 2), { encoding: 'utf8', mode: 0o600 })
      try {
        await chmod(tempPath, 0o600)
      } catch {
        // Ignored on systems without posix permissions
      }
      await rename(tempPath, this.filePath)
    } finally {
      this._isSaving = false
      if (this._dirty) {
        this.scheduleSave()
      }
    }
  }

  /**
   * Schedule a debounced save to avoid excessive I/O operations during rapid updates.
   */
  private scheduleSave(delayMs: number = 50): void {
    this._dirty = true
    if (this._saveTimer || this._isSaving) return

    this._saveTimer = setTimeout(() => {
      this._saveTimer = null
      this.save().catch((err) => {
        console.error('FileStorage scheduleSave failed:', err)
      })
    }, delayMs)
  }

  public override async close(): Promise<void> {
    if (this._dirty || this._saveTimer) {
      await this.save()
    }
  }

  public override async delete(): Promise<void> {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer)
      this._saveTimer = null
    }
    try {
      await unlink(this.filePath)
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err
    }
    this._authKey = null
    this._userId = null
    this._peersById.clear()
    this._dirty = false
  }

  public override async getDcId(): Promise<number> { return this._dcId }
  public override async setDcId(val: number): Promise<void> { this._dcId = val; this.scheduleSave() }

  public override async getApiId(): Promise<number> { return this._apiId }
  public override async setApiId(val: number): Promise<void> { this._apiId = val; this.scheduleSave() }

  public override async getTestMode(): Promise<boolean> { return this._testMode }
  public override async setTestMode(val: boolean): Promise<void> { this._testMode = val; this.scheduleSave() }

  public override async getAuthKey(): Promise<AuthKey | null> { return this._authKey }
  public override async setAuthKey(val: AuthKey | null): Promise<void> { this._authKey = val; this.scheduleSave() }

  public override async getUserId(): Promise<bigint | null> { return this._userId }
  public override async setUserId(val: bigint | null): Promise<void> { this._userId = val; this.scheduleSave() }

  public override async getIsBot(): Promise<boolean> { return this._isBot }
  public override async setIsBot(val: boolean): Promise<void> { this._isBot = val; this.scheduleSave() }

  public override async updatePeer(peer: PeerInfo): Promise<void> {
    this._peersById.set(peer.id, peer)
    this.scheduleSave()
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
