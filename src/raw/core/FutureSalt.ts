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

export class FutureSalt extends TLObject {
    static readonly ID = 0x0949d9dc

    readonly QUALNAME = "FutureSalt"

    __slots__ = ["validSince", "validUntil", "salt"]

    constructor(
        readonly validSince: number,
        readonly validUntil: number,
        readonly salt: bigint
    ) {
        super()
    }

    static read(r: BinaryReader): FutureSalt {
        const validSince = r.readInt32(true)
        const validUntil = r.readInt32(true)
        const salt       = r.readInt64()
        return new FutureSalt(validSince, validUntil, salt)
    }

    write(): Buffer {
        const b = new BinaryWriter()
        b.writeInt32(FutureSalt.ID, false)
        b.writeInt32(this.validSince)
        b.writeInt32(this.validUntil)
        b.writeInt64(this.salt)
        return b.toBuffer()
    }
}

objects.set(FutureSalt.ID, FutureSalt)
