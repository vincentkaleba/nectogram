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

import { BinaryReader } from "./BinaryReader.js"
import { BinaryWriter } from "./BinaryWriter.js"
import { TLObject, objects } from "./TLObject.js"

export class Message extends TLObject {
    static readonly ID = 0x5bb8e511  // crc32("message msg_id:long seqno:int bytes:int body:Object = Message")

    readonly QUALNAME = "Message"

    __slots__ = ["msgId", "seqNo", "length", "body"]

    constructor(
        readonly body: TLObject,
        readonly msgId: bigint,
        readonly seqNo: number,
        readonly length: number
    ) {
        super()
    }

    static read(r: BinaryReader): Message {
        const msgId  = r.readInt64()
        const seqNo  = r.readInt32(true)
        const length = r.readInt32(false)
        const body   = TLObject.read(new BinaryReader(r.read(length)))
        return new Message(body, msgId, seqNo, length)
    }

    write(): Buffer {
        const bodyBuf = this.body.write()
        const b = new BinaryWriter()
        b.writeInt64(this.msgId)
        b.writeInt32(this.seqNo)
        b.writeInt32(bodyBuf.length, false)
        b.write(bodyBuf)
        return b.toBuffer()
    }
}

objects.set(Message.ID, Message)
