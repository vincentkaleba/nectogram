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

import { TCP } from './TCP.js'

export class TCPIntermediate extends TCP {
  public static readonly OBFUSCATE_TAG = Buffer.from([0xee, 0xee, 0xee, 0xee])

  protected override async onConnected(): Promise<void> {
    if (this.socket) {
      await new Promise<void>((resolve, reject) => {
        this.socket!.write(TCPIntermediate.OBFUSCATE_TAG, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }
  }

  public override async send(data: Buffer): Promise<void> {
    if (!this.socket || !this._connected) {
      throw new Error('TCPIntermediate: socket is not connected')
    }

    const header = Buffer.alloc(4)
    header.writeUInt32LE(data.length, 0)

    const packet = Buffer.concat([header, data])
    return new Promise((resolve, reject) => {
      this.socket!.write(packet, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  protected override onRawData(chunk: Buffer): void {
    this._buffer = Buffer.concat([this._buffer, chunk])

    while (this._buffer.length >= 4) {
      const payloadLength = this._buffer.readUInt32LE(0)
      const totalLength = 4 + payloadLength

      if (this._buffer.length < totalLength) return // Wait for full packet

      const payload = Buffer.from(this._buffer.subarray(4, totalLength))
      this._buffer = Buffer.from(this._buffer.subarray(totalLength))

      this.emit('payload', payload)
    }
  }
}
