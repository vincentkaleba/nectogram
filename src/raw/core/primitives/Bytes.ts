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

import { BinaryReader } from "../BinaryReader.js"

export function readTLBytes(r: BinaryReader): Buffer {
    return r.readTLBytes()
}

// length <= 253 → [1B len] data pad4;  length > 253 → [0xFE][3B len LE] data pad4
export function writeTLBytes(val: Buffer): Buffer {
    const len = val.length
    const chunks: Buffer[] = []

    if (len <= 253) {
        chunks.push(Buffer.from([len]))
        chunks.push(val)
        const padding = (-(len + 1)) & 3
        if (padding > 0) chunks.push(Buffer.alloc(padding))
    } else {
        chunks.push(Buffer.from([0xfe, len & 0xff, (len >> 8) & 0xff, (len >> 16) & 0xff]))
        chunks.push(val)
        const padding = (-len) & 3
        if (padding > 0) chunks.push(Buffer.alloc(padding))
    }

    return Buffer.concat(chunks)
}
