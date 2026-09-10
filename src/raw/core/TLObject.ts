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

import type { BinaryReader } from "./BinaryReader.js"

// Global registry of all TL constructors, populated by src/raw/all.ts (generated).
export const objects: Map<number, { read(r: BinaryReader): TLObject }> = new Map()

// Sensitive field names to mask in string representations, mirroring Pyrogram's behaviour.
const MASKED_FIELDS = new Set(["code", "phone", "token", "password", "secret"])

export abstract class TLObject {
    abstract readonly QUALNAME: string

    abstract write(): Buffer

    static read(r: BinaryReader): any {
        const id = r.readInt32(false)
        if (id === 0x1cb5c415) {
            const count = r.readInt32(false)
            return Array.from({ length: count }, () => TLObject.read(r))
        }
        const ctor = objects.get(id)

        if (!ctor) {
            const preview = r.slice(r.tell(), Math.min(r.tell() + 32, r.getBuffer().length))
            throw new Error(
                `TLObject.read: unknown constructor 0x${id.toString(16).padStart(8, "0")} ` +
                `(preview: ${preview.toString("hex")})`
            )
        }

        return ctor.read(r)
    }

    // Return a filtered attribute map, masking sensitive fields (mirrors TLObject.default in Pyrogram).
    private _toDict(): Record<string, unknown> {
        const result: Record<string, unknown> = { _: this.QUALNAME }

        for (const [key, value] of Object.entries(this)) {
            if (value === undefined || value === null) continue
            result[key] = MASKED_FIELDS.has(key) ? "*".repeat(9) : value
        }

        return result
    }

    toString(): string {
        return JSON.stringify(this._toDict(), (_k, v) =>
            typeof v === "bigint" ? `${v}` : v
        , 4)
    }

    get [Symbol.toStringTag](): string {
        return `nectogram.raw.${this.QUALNAME}`
    }
}
