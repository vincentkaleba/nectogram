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

import { describe, it, expect } from 'vitest'
import { randomBytes } from 'node:crypto'
import { AuthKey, Session } from '../src/session/index.js'
import { Connection } from '../src/connection/index.js'
import { Message } from '../src/raw/index.js'
import { Ping } from '../src/raw/functions/index.js'

describe('Session & AuthKey Module', () => {
  describe('AuthKey', () => {
    it('should create AuthKey and compute keyId', () => {
      const keyBytes = Buffer.alloc(256, 0x42)
      const authKey = new AuthKey(keyBytes)

      expect(authKey.key.length).toBe(256)
      expect(authKey.keyIdBuffer.length).toBe(8)
      expect(typeof authKey.keyId).toBe('bigint')
    })

    it('should throw RangeError if key length is not 256 bytes', () => {
      expect(() => new AuthKey(Buffer.alloc(128))).toThrow(RangeError)
    })
  })

  describe('Session Packet Packing & Unpacking', () => {
    it('should generate strictly monotonic message IDs divisible by 4', () => {
      const conn = new Connection({ dcId: 2, testMode: true })
      const authKey = new AuthKey(Buffer.alloc(256, 0x07))
      const session = new Session(conn, authKey)

      const id1 = session.getNewMessageId()
      const id2 = session.getNewMessageId()
      const id3 = session.getNewMessageId()

      expect(id1 % 4n).toBe(0n)
      expect(id2 % 4n).toBe(0n)
      expect(id3 % 4n).toBe(0n)

      expect(id1 < id2).toBe(true)
      expect(id2 < id3).toBe(true)
    })

    it('should pack and unpack MTProto v2.0 encrypted message roundtrip', () => {
      const conn = new Connection({ dcId: 2, testMode: true })
      const authKey = new AuthKey(Buffer.from(Array.from({ length: 256 }, (_, i) => (i * 11 + 3) & 0xff)))
      const session = new Session(conn, authKey, 0x1234567890abcdefn)

      const pingObj = new Ping(12345n)
      const dummyPayload = new Message(
        pingObj,
        session.getNewMessageId(),
        1,
        pingObj.write().length
      )

      const packed = session.pack(dummyPayload, false)
      expect(packed.length).toBeGreaterThan(64)
      expect(packed.subarray(0, 8)).toEqual(authKey.keyIdBuffer)

      const unpacked = session.unpack(packed)
      expect(unpacked.msgId).toBe(dummyPayload.msgId)
      expect(unpacked.seqNo).toBe(1)
      expect((unpacked.body as Ping).ping_id).toBe(12345n)
    })
  })
})
