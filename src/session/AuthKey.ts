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

import { sha1, sha256 } from '../crypto/mtproto.js'

/**
 * Encapsulates the 256-byte MTProto AuthKey and its derived Key ID.
 */
export class AuthKey {
  public readonly key: Buffer
  public readonly keyIdBuffer: Buffer
  public readonly keyId: bigint

  constructor(key: Buffer) {
    if (key.length !== 256) {
      throw new RangeError(`AuthKey: key must be exactly 256 bytes, got ${key.length}`)
    }

    this.key = Buffer.from(key)
    const hash = sha1(this.key)
    this.keyIdBuffer = Buffer.from(hash.subarray(12, 20))
    this.keyId = this.keyIdBuffer.readBigUInt64LE(0)
  }

  /**
   * Calculate 16-byte msg_key for MTProto v2.0 payload.
   */
  public calcMsgKey(data: Buffer, outgoing: boolean): Buffer {
    const x = outgoing ? 0 : 8
    const msgKeyLarge = sha256(Buffer.concat([this.key.subarray(88 + x, 88 + x + 32), data]))
    return Buffer.from(msgKeyLarge.subarray(8, 24))
  }
}
