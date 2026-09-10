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
import { Message } from "./Message.js"

export class MsgContainer extends TLObject {
    static readonly ID = 0x73f1f8dc
    static readonly MAXIMUM_LENGTH = 1044456

    readonly QUALNAME = "MsgContainer"

    __slots__ = ["messages"]

    constructor(readonly messages: Message[]) {
        super()
    }

    static read(r: BinaryReader): MsgContainer {
        const count = r.readInt32(false)
        const messages: Message[] = []
        for (let i = 0; i < count; i++) messages.push(Message.read(r))
        return new MsgContainer(messages)
    }

    write(): Buffer {
        const b = new BinaryWriter()
        b.writeInt32(MsgContainer.ID, false)
        b.writeInt32(this.messages.length, false)
        for (const msg of this.messages) b.write(msg.write())
        return b.toBuffer()
    }
}

objects.set(MsgContainer.ID, MsgContainer)
