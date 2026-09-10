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
import { TLObject } from "../TLObject.js"
import { readInt32, writeInt32 } from "./Int.js"
import { BOOL_FALSE_ID, BOOL_TRUE_ID } from "./Bool.js"

export const VECTOR_ID = 0x1cb5c415  // crc32("vector")

// Method added to handle the special case when a query returns a bare Vector (of Ints);
// i.e., the body starts with 0x1cb5c415 — e.g., messages.GetMessagesViews.
export function readVectorBare(r: BinaryReader, itemSize: number): unknown[] {
    if (itemSize === 4) {
        const e = r.readInt32(false)
        r.seek(-4)

        if (e === BOOL_FALSE_ID || e === BOOL_TRUE_ID) {
            return [r.readBool()]
        }

        return [r.readInt32(true)]
    }

    if (itemSize === 8) {
        return [r.readInt64()]
    }

    return [TLObject.read(r)]
}

export function readVector<T>(
    r: BinaryReader,
    itemReader?: (r: BinaryReader) => T,
    bare = false
): T[] {
    if (!bare) {
        const id = readInt32(r, false)
        if (id !== VECTOR_ID) {
            throw new Error(`readVector: expected 0x1cb5c415, got 0x${id.toString(16)}`)
        }
    }

    const count = readInt32(r, false)
    const result: T[] = []

    // Estimate element size for bare-vector dispatch (mirrors Pyrogram's left/size heuristic)
    const snapshot = r.tell()
    const available = r.remaining()
    const itemSize = count > 0 ? available / count : 0
    r.seekAbs(snapshot)

    for (let i = 0; i < count; i++) {
        if (itemReader) {
            result.push(itemReader(r))
        } else {
            result.push(...(readVectorBare(r, itemSize) as T[]))
        }
    }

    return result
}

export function writeVector<T>(items: T[], itemWriter: (item: T) => Buffer, bare = false): Buffer {
    const parts: Buffer[] = []

    if (!bare) {
        const header = Buffer.allocUnsafe(8)
        header.writeUInt32LE(VECTOR_ID, 0)
        header.writeUInt32LE(items.length, 4)
        parts.push(header)
    } else {
        parts.push(writeInt32(items.length, false))
    }

    for (const item of items) {
        parts.push(itemWriter(item))
    }

    return Buffer.concat(parts)
}
