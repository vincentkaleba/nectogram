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

export class TCPAbridged extends TCP {
  public static readonly OBFUSCATE_TAG = Buffer.from([0xef, 0xef, 0xef, 0xef])

  protected override async onConnected(): Promise<void> {
    if (this.socket) {
      await new Promise<void>((resolve, reject) => {
        this.socket!.write(Buffer.from([0xef]), (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }
  }

  public override async send(data: Buffer): Promise<void> {
    if (!this.socket || !this._connected) {
      throw new Error('TCPAbridged: socket is not connected')
    }

    const length = data.length / 4
    let header: Buffer

    if (length <= 126) {
      header = Buffer.from([length])
    } else {
      header = Buffer.alloc(4)
      header[0] = 0x7f
      header.writeUIntLE(length, 1, 3)
    }

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

    while (this._buffer.length > 0) {
      const firstByte = this._buffer[0]
      let headerLength = 1
      let payloadLength = 0

      if (firstByte === 0x7f) {
        if (this._buffer.length < 4) return // Wait for full 4-byte header
        headerLength = 4
        payloadLength = this._buffer.readUIntLE(1, 3) * 4
      } else {
        payloadLength = firstByte * 4
      }

      const totalLength = headerLength + payloadLength
      if (this._buffer.length < totalLength) return // Wait for full packet

      const payload = Buffer.from(this._buffer.subarray(headerLength, totalLength))
      this._buffer = Buffer.from(this._buffer.subarray(totalLength))

      this.emit('payload', payload)
    }
  }
}
