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
import { TLObject, objects } from "../TLObject.js"
import { writeInt32 } from "./Int.js"

export const BOOL_TRUE_ID  = 0x997275b5  // crc32("boolTrue")
export const BOOL_FALSE_ID = 0xbc799737  // crc32("boolFalse")

export function readBool(r: BinaryReader): boolean {
    const id = r.readInt32(false)
    if (id === BOOL_TRUE_ID)  return true
    if (id === BOOL_FALSE_ID) return false
    throw new Error(`readBool: unexpected constructor 0x${id.toString(16)}`)
}

export function writeBool(val: boolean): Buffer {
    return writeInt32(val ? BOOL_TRUE_ID : BOOL_FALSE_ID, false)
}

export class BoolTrue extends TLObject {
    static readonly ID = BOOL_TRUE_ID
    readonly QUALNAME = "BoolTrue"

    static read(_r: BinaryReader): BoolTrue {
        return new BoolTrue()
    }

    write(): Buffer {
        return writeBool(true)
    }
}

export class BoolFalse extends TLObject {
    static readonly ID = BOOL_FALSE_ID
    readonly QUALNAME = "BoolFalse"

    static read(_r: BinaryReader): BoolFalse {
        return new BoolFalse()
    }

    write(): Buffer {
        return writeBool(false)
    }
}

objects.set(BOOL_TRUE_ID,  BoolTrue)
objects.set(BOOL_FALSE_ID, BoolFalse)
