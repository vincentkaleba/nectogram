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

export class BinaryReader {
    private _buf: Buffer
    private _pos: number

    constructor(buf: Buffer) {
        this._buf = buf
        this._pos = 0
    }

    read(n: number): Buffer {
        if (this._pos + n > this._buf.length) {
            throw new RangeError(
                `BinaryReader: cannot read ${n} bytes at pos ${this._pos} (buf length=${this._buf.length})`
            )
        }
        const slice = this._buf.subarray(this._pos, this._pos + n)
        this._pos += n
        return Buffer.from(slice)
    }

    readInt32(signed = true): number {
        const buf = this.read(4)
        return signed ? buf.readInt32LE(0) : buf.readUInt32LE(0)
    }

    readInt64(): bigint {
        const buf = this.read(8)
        return buf.readBigInt64LE(0)
    }

    readInt128(): Buffer {
        return this.read(16)
    }

    readInt256(): Buffer {
        return this.read(32)
    }

    readDouble(): number {
        const buf = this.read(8)
        return buf.readDoubleLE(0)
    }

    readBool(): boolean {
        const id = this.readInt32(false)
        if (id === 0x997275b5) return true   // boolTrue
        if (id === 0xbc799737) return false  // boolFalse
        throw new Error(`BinaryReader: unexpected bool constructor 0x${id.toString(16)}`)
    }

    // TL bytes: length <= 253 → [1B len] data pad4; else → [0xFE][3B len] data pad4
    readTLBytes(): Buffer {
        const first = this.read(1)[0]
        let length: number
        let overhead: number

        if (first <= 253) {
            length = first
            overhead = 1
        } else if (first === 254) {
            const b = this.read(3)
            length = b[0] | (b[1] << 8) | (b[2] << 16)
            overhead = 4
        } else {
            throw new RangeError(`BinaryReader: invalid TL bytes prefix 0x${first.toString(16)}`)
        }

        const data = this.read(length)
        const padding = (-(overhead + length)) & 3
        if (padding > 0) this.read(padding)
        return data
    }

    readTLString(): string {
        return this.readTLBytes().toString("utf8")
    }

    seek(n: number): void {
        const next = this._pos + n
        if (next < 0 || next > this._buf.length) {
            throw new RangeError(`BinaryReader: seek(${n}) out of bounds at pos ${this._pos}`)
        }
        this._pos = next
    }

    seekAbs(pos: number): void {
        if (pos < 0 || pos > this._buf.length) {
            throw new RangeError(`BinaryReader: seekAbs(${pos}) out of bounds`)
        }
        this._pos = pos
    }

    tell(): number {
        return this._pos
    }

    remaining(): number {
        return this._buf.length - this._pos
    }

    getBuffer(): Buffer {
        return this._buf
    }

    slice(from: number, to: number): Buffer {
        return Buffer.from(this._buf.subarray(from, to))
    }
}
