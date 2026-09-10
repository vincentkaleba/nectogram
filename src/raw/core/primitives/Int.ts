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

export function readInt32(r: BinaryReader, signed = true): number {
    return r.readInt32(signed)
}

export function writeInt32(val: number, signed = true): Buffer {
    const buf = Buffer.allocUnsafe(4)
    signed ? buf.writeInt32LE(val, 0) : buf.writeUInt32LE(val >>> 0, 0)
    return buf
}

// Long values (msg_id, access_hash, user_id…) must be bigint: number is float64,
// which cannot represent integers beyond 2^53 − 1 without precision loss.
export function readInt64(r: BinaryReader): bigint {
    return r.readInt64()
}

export function writeInt64(val: bigint): Buffer {
    const buf = Buffer.allocUnsafe(8)
    buf.writeBigInt64LE(val, 0)
    return buf
}

export function writeUInt64(val: bigint): Buffer {
    const buf = Buffer.allocUnsafe(8)
    buf.writeBigUInt64LE(val, 0)
    return buf
}

export function readInt128(r: BinaryReader): Buffer {
    return r.readInt128()
}

export function writeInt128(val: Buffer): Buffer {
    if (val.length !== 16) throw new RangeError(`writeInt128: expected 16 bytes, got ${val.length}`)
    return Buffer.from(val)
}

export function readInt256(r: BinaryReader): Buffer {
    return r.readInt256()
}

export function writeInt256(val: Buffer): Buffer {
    if (val.length !== 32) throw new RangeError(`writeInt256: expected 32 bytes, got ${val.length}`)
    return Buffer.from(val)
}
