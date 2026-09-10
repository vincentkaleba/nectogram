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

import { Storage, PeerInfo } from './Storage.js'
import { AuthKey } from '../session/AuthKey.js'

/**
 * Ephemeral in-memory storage implementation for Nectogram.
 */
export class MemoryStorage extends Storage {
  private _dcId: number = 2
  private _apiId: number = 0
  private _testMode: boolean = false
  private _authKey: AuthKey | null = null
  private _userId: bigint | null = null
  private _isBot: boolean = false

  private readonly _peersById: Map<bigint, PeerInfo> = new Map()
  private readonly _peersByUsername: Map<string, PeerInfo> = new Map()
  private readonly _peersByPhone: Map<string, PeerInfo> = new Map()

  public override async open(): Promise<void> {}
  public override async save(): Promise<void> {}
  public override async close(): Promise<void> {}

  public override async delete(): Promise<void> {
    this._authKey = null
    this._userId = null
    this._peersById.clear()
    this._peersByUsername.clear()
    this._peersByPhone.clear()
  }

  public override async getDcId(): Promise<number> { return this._dcId }
  public override async setDcId(val: number): Promise<void> { this._dcId = val }

  public override async getApiId(): Promise<number> { return this._apiId }
  public override async setApiId(val: number): Promise<void> { this._apiId = val }

  public override async getTestMode(): Promise<boolean> { return this._testMode }
  public override async setTestMode(val: boolean): Promise<void> { this._testMode = val }

  public override async getAuthKey(): Promise<AuthKey | null> { return this._authKey }
  public override async setAuthKey(val: AuthKey | null): Promise<void> { this._authKey = val }

  public override async getUserId(): Promise<bigint | null> { return this._userId }
  public override async setUserId(val: bigint | null): Promise<void> { this._userId = val }

  public override async getIsBot(): Promise<boolean> { return this._isBot }
  public override async setIsBot(val: boolean): Promise<void> { this._isBot = val }

  public override async updatePeer(peer: PeerInfo): Promise<void> {
    this._peersById.set(peer.id, peer)
    if (peer.username) {
      this._peersByUsername.set(peer.username.toLowerCase(), peer)
    }
    if (peer.phone) {
      this._peersByPhone.set(peer.phone, peer)
    }
  }

  public override async getPeerById(id: bigint): Promise<PeerInfo | null> {
    return this._peersById.get(id) ?? null
  }

  public override async getPeerByUsername(username: string): Promise<PeerInfo | null> {
    return this._peersByUsername.get(username.toLowerCase()) ?? null
  }

  public override async getPeerByPhone(phone: string): Promise<PeerInfo | null> {
    return this._peersByPhone.get(phone) ?? null
  }
}
