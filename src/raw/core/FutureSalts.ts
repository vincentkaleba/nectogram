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
import { FutureSalt } from "./FutureSalt.js"

export class FutureSalts extends TLObject {
    static readonly ID = 0xae500895

    readonly QUALNAME = "FutureSalts"

    __slots__ = ["reqMsgId", "now", "results"]

    constructor(
        readonly reqMsgId: bigint,
        readonly now: number,
        readonly results: FutureSalt[]
    ) {
        super()
    }

    static read(r: BinaryReader): FutureSalts {
        const reqMsgId = r.readInt64()
        const now      = r.readInt32(true)
        const count    = r.readInt32(false)  // bare Vector: count only, no VECTOR_ID prefix
        const results: FutureSalt[] = []

        for (let i = 0; i < count; i++) {
            const validSince = r.readInt32(true)
            const validUntil = r.readInt32(true)
            const salt       = r.readInt64()
            results.push(new FutureSalt(validSince, validUntil, salt))
        }

        return new FutureSalts(reqMsgId, now, results)
    }

    write(): Buffer {
        const b = new BinaryWriter()
        b.writeInt32(FutureSalts.ID, false)
        b.writeInt64(this.reqMsgId)
        b.writeInt32(this.now)
        b.writeInt32(this.results.length, false)
        for (const s of this.results) {
            b.writeInt32(s.validSince)
            b.writeInt32(s.validUntil)
            b.writeInt64(s.salt)
        }
        return b.toBuffer()
    }
}

objects.set(FutureSalts.ID, FutureSalts)
