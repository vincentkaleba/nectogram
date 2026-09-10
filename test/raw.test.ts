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
import { BinaryReader, BinaryWriter, TLObject, Message, MsgContainer, GzipPacked, FutureSalt, FutureSalts } from '../src/raw/core/index.js'
import * as raw from '../src/raw/index.js'

describe('BinaryReader & BinaryWriter', () => {
  it('should serialize and deserialize int32', () => {
    const w = new BinaryWriter()
    w.writeInt32(12345678)
    const r = new BinaryReader(w.toBuffer())
    expect(r.readInt32()).toBe(12345678)
  })

  it('should serialize and deserialize int64', () => {
    const w = new BinaryWriter()
    const val = 0x123456789abcdef0n
    w.writeInt64(val)
    const r = new BinaryReader(w.toBuffer())
    expect(r.readInt64()).toBe(val)
  })

  it('should serialize and deserialize boolean', () => {
    const w1 = new BinaryWriter()
    w1.writeBool(true)
    const r1 = new BinaryReader(w1.toBuffer())
    expect(r1.readBool()).toBe(true)

    const w2 = new BinaryWriter()
    w2.writeBool(false)
    const r2 = new BinaryReader(w2.toBuffer())
    expect(r2.readBool()).toBe(false)
  })

  it('should serialize and deserialize TL string', () => {
    const str = 'Hello Nectogram Telegram client!'
    const w = new BinaryWriter()
    w.writeTLString(str)
    const r = new BinaryReader(w.toBuffer())
    expect(r.readTLString()).toBe(str)
  })
})

describe('MTProto Core Messages', () => {
  it('should serialize and deserialize Message', () => {
    const ping = new raw.functions.Ping(1001n)
    const pingBuf = ping.write()
    const msg = new Message(ping, 100n, 1, pingBuf.length)
    const buf = msg.write()
    const r = new BinaryReader(buf)
    const readMsg = Message.read(r)
    expect(readMsg.msgId).toBe(100n)
    expect(readMsg.seqNo).toBe(1)
    expect((readMsg.body as raw.functions.Ping).ping_id).toBe(1001n)
  })

  it('should serialize and deserialize MsgContainer', () => {
    const ping1 = new raw.functions.Ping(1n)
    const ping2 = new raw.functions.Ping(2n)
    const msg1 = new Message(ping1, 101n, 1, ping1.write().length)
    const msg2 = new Message(ping2, 102n, 3, ping2.write().length)
    const container = new MsgContainer([msg1, msg2])
    const buf = container.write()
    const r = new BinaryReader(buf)
    const readContainer = TLObject.read(r) as MsgContainer
    expect(readContainer).toBeInstanceOf(MsgContainer)
    expect(readContainer.messages.length).toBe(2)
    expect(readContainer.messages[0].msgId).toBe(101n)
    expect(readContainer.messages[1].msgId).toBe(102n)
  })
})

describe('Generated TL Types & Functions', () => {
  it('should read and write Ping function correctly', () => {
    const ping = new raw.functions.Ping(999n)
    const buf = ping.write()
    const r = new BinaryReader(buf)
    const id = r.readInt32(false)
    expect(id).toBe(raw.functions.Ping.ID)
    const readPing = raw.functions.Ping.read(r)
    expect(readPing.ping_id).toBe(999n)
  })

  it('should read and write User type correctly', () => {
    const user = new raw.types.User(
      123456789n,
      true, // isSelf
      false, // contact
      false, // mutual_contact
      false, // deleted
      false, // bot
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      987654321n, // access_hash
      'John',
      'Doe',
      'johndoe'
    )
    const buf = user.write()
    const r = new BinaryReader(buf)
    const readId = r.readInt32(false)
    expect(readId).toBe(raw.types.User.ID)
    const readUser = raw.types.User.read(r)
    expect(readUser.id).toBe(123456789n)
    expect(readUser.isSelf).toBe(true)
    expect(readUser.first_name).toBe('John')
    expect(readUser.last_name).toBe('Doe')
    expect(readUser.username).toBe('johndoe')
    expect(readUser.access_hash).toBe(987654321n)
  })
})
