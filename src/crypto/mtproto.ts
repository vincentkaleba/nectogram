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

import { createHash } from 'node:crypto'

export function sha1(data: Buffer): Buffer {
  return createHash('sha1').update(data).digest()
}

export function sha256(data: Buffer): Buffer {
  return createHash('sha256').update(data).digest()
}

/**
 * MTProto v2.0 Key Derivation Function (KDF).
 * Derives the 32-byte AES key and 32-byte IV from the authKey and msgKey.
 */
export function kdf(authKey: Buffer, msgKey: Buffer, outgoing: boolean): { key: Buffer; iv: Buffer } {
  if (authKey.length !== 256) {
    throw new RangeError(`kdf: authKey must be 256 bytes, got ${authKey.length}`)
  }
  if (msgKey.length !== 16) {
    throw new RangeError(`kdf: msgKey must be 16 bytes, got ${msgKey.length}`)
  }

  const x = outgoing ? 0 : 8

  // sha256_a = SHA256(msg_key + auth_key[x : x + 36])
  const sha256A = sha256(Buffer.concat([msgKey, authKey.subarray(x, x + 36)]))

  // sha256_b = SHA256(auth_key[x + 40 : x + 76] + msg_key)
  const sha256B = sha256(Buffer.concat([authKey.subarray(x + 40, x + 76), msgKey]))

  // aes_key = sha256_a[0:8] + sha256_b[8:24] + sha256_a[24:32]
  const key = Buffer.concat([
    sha256A.subarray(0, 8),
    sha256B.subarray(8, 24),
    sha256A.subarray(24, 32),
  ])

  // aes_iv = sha256_b[0:8] + sha256_a[8:24] + sha256_b[24:32]
  const iv = Buffer.concat([
    sha256B.subarray(0, 8),
    sha256A.subarray(8, 24),
    sha256B.subarray(24, 32),
  ])

  return { key, iv }
}
