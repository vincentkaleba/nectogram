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

import { gunzipSync, gzipSync } from "node:zlib"

import { BinaryReader } from "./BinaryReader.js"
import { BinaryWriter } from "./BinaryWriter.js"
import { TLObject, objects } from "./TLObject.js"
import { writeTLBytes } from "./primitives/Bytes.js"

export class GzipPacked extends TLObject {
    static readonly ID = 0x3072cfa1

    readonly QUALNAME = "GzipPacked"

    __slots__ = ["packedData"]

    constructor(readonly packedData: TLObject) {
        super()
    }

    // Return the Object itself instead of a GzipPacked wrapping it.
    static read(r: BinaryReader): TLObject {
        return TLObject.read(new BinaryReader(gunzipSync(r.readTLBytes())))
    }

    write(): Buffer {
        const b = new BinaryWriter()
        b.writeInt32(GzipPacked.ID, false)
        b.write(writeTLBytes(gzipSync(this.packedData.write())))
        return b.toBuffer()
    }
}

objects.set(GzipPacked.ID, GzipPacked)
