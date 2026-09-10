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

export class BinaryWriter {
    private _chunks: Buffer[] = []

    write(buf: Buffer): this {
        this._chunks.push(buf)
        return this
    }

    writeInt32(val: number, signed = true): this {
        const buf = Buffer.allocUnsafe(4)
        signed ? buf.writeInt32LE(val, 0) : buf.writeUInt32LE(val >>> 0, 0)
        return this.write(buf)
    }

    writeInt64(val: bigint): this {
        const buf = Buffer.allocUnsafe(8)
        buf.writeBigInt64LE(BigInt.asIntN(64, val), 0)
        return this.write(buf)
    }

    writeUInt64(val: bigint): this {
        const buf = Buffer.allocUnsafe(8)
        buf.writeBigUInt64LE(BigInt.asUintN(64, val), 0)
        return this.write(buf)
    }

    writeInt128(val: Buffer): this {
        if (val.length !== 16) throw new RangeError(`writeInt128: expected 16 bytes, got ${val.length}`)
        return this.write(val)
    }

    writeInt256(val: Buffer): this {
        if (val.length !== 32) throw new RangeError(`writeInt256: expected 32 bytes, got ${val.length}`)
        return this.write(val)
    }

    writeDouble(val: number): this {
        const buf = Buffer.allocUnsafe(8)
        buf.writeDoubleLE(val, 0)
        return this.write(buf)
    }

    writeBool(val: boolean): this {
        return this.writeInt32(val ? 0x997275b5 : 0xbc799737, false)
    }

    // TL bytes: length <= 253 → [1B len] data pad4; else → [0xFE][3B len] data pad4
    writeTLBytes(val: Buffer): this {
        const len = val.length

        if (len <= 253) {
            this.write(Buffer.from([len]))
            this.write(val)
            const padding = (-(len + 1)) & 3
            if (padding > 0) this.write(Buffer.alloc(padding))
        } else {
            const header = Buffer.from([0xfe, len & 0xff, (len >> 8) & 0xff, (len >> 16) & 0xff])
            this.write(header)
            this.write(val)
            const padding = (-len) & 3
            if (padding > 0) this.write(Buffer.alloc(padding))
        }

        return this
    }

    writeTLString(val: string): this {
        return this.writeTLBytes(Buffer.from(val, "utf8"))
    }

    toBuffer(): Buffer {
        return Buffer.concat(this._chunks)
    }

    get length(): number {
        return this._chunks.reduce((acc, c) => acc + c.length, 0)
    }
}
