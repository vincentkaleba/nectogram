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

import { AuthKey } from '../session/AuthKey.js'

export interface PeerInfo {
  id: bigint
  accessHash: bigint
  type: string
  username?: string
  phone?: string
}

/**
 * Abstract class for storage engines in Nectogram.
 */
export abstract class Storage {
  public abstract open(): Promise<void>
  public abstract save(): Promise<void>
  public abstract close(): Promise<void>
  public abstract delete(): Promise<void>

  // Session Properties
  public abstract getDcId(): Promise<number>
  public abstract setDcId(val: number): Promise<void>

  public abstract getApiId(): Promise<number>
  public abstract setApiId(val: number): Promise<void>

  public abstract getTestMode(): Promise<boolean>
  public abstract setTestMode(val: boolean): Promise<void>

  public abstract getAuthKey(): Promise<AuthKey | null>
  public abstract setAuthKey(val: AuthKey | null): Promise<void>

  public abstract getUserId(): Promise<bigint | null>
  public abstract setUserId(val: bigint | null): Promise<void>

  public abstract getIsBot(): Promise<boolean>
  public abstract setIsBot(val: boolean): Promise<void>

  // Peer Cache API
  public abstract updatePeer(peer: PeerInfo): Promise<void>
  public abstract getPeerById(id: bigint): Promise<PeerInfo | null>
  public abstract getPeerByUsername(username: string): Promise<PeerInfo | null>
  public abstract getPeerByPhone(phone: string): Promise<PeerInfo | null>

  /**
   * Export session credentials as a Pyrogram-compatible base64url session string.
   */
  public async exportSessionString(): Promise<string> {
    const dcId = await this.getDcId()
    const apiId = await this.getApiId()
    const testMode = await this.getTestMode()
    const authKeyObj = await this.getAuthKey()
    const userId = (await this.getUserId()) ?? 0n
    const isBot = await this.getIsBot()

    if (!authKeyObj) {
      throw new Error('exportSessionString: authKey is null')
    }

    const buf = Buffer.alloc(271)
    buf.writeUInt8(dcId, 0)
    buf.writeUInt32BE(apiId, 1)
    buf.writeUInt8(testMode ? 1 : 0, 5)
    authKeyObj.key.copy(buf, 6, 0, 256)
    buf.writeBigUInt64BE(userId, 262)
    buf.writeUInt8(isBot ? 1 : 0, 270)

    return buf.toString('base64url')
  }

  /**
   * Import session credentials from a Pyrogram-compatible base64url session string.
   */
  public async importSessionString(sessionString: string): Promise<void> {
    const buf = Buffer.from(sessionString, 'base64url')
    if (buf.length !== 271) {
      throw new Error(`importSessionString: invalid session string length (${buf.length}, expected 271)`)
    }

    const dcId = buf.readUInt8(0)
    if (dcId < 1 || dcId > 5) {
      throw new Error(`importSessionString: invalid DC ID (${dcId})`)
    }

    const apiId = buf.readUInt32BE(1)
    const testMode = buf.readUInt8(5) !== 0
    const authKeyBytes = Buffer.from(buf.subarray(6, 262))
    if (authKeyBytes.length !== 256) {
      throw new Error(`importSessionString: invalid AuthKey length (${authKeyBytes.length})`)
    }

    const userId = buf.readBigUInt64BE(262)
    const isBot = buf.readUInt8(270) !== 0

    await this.setDcId(dcId)
    await this.setApiId(apiId)
    await this.setTestMode(testMode)
    await this.setAuthKey(new AuthKey(authKeyBytes))
    await this.setUserId(userId === 0n ? null : userId)
    await this.setIsBot(isBot)
  }
}
