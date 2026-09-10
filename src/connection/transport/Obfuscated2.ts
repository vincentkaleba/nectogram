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

import { createCipheriv, createDecipheriv, randomBytes, Cipher, Decipher } from 'node:crypto'
import { sha256 } from '../../crypto/mtproto.js'
import { TCP, TCPConnectOptions } from './TCP.js'
import { TCPAbridged } from './Abridged.js'
import { TCPIntermediate } from './Intermediate.js'

const RESERVED_PREFIXES = [
  Buffer.from('HEAD', 'ascii'),
  Buffer.from('POST', 'ascii'),
  Buffer.from('GET ', 'ascii'),
  Buffer.from('OPTI', 'ascii'),
  Buffer.from([0xdd, 0xdd, 0xdd, 0xdd]),
  Buffer.from([0xee, 0xee, 0xee, 0xee]),
  Buffer.from([0x16, 0x03, 0x01, 0x02]),
]

export function generateObfuscated2Nonce(): Buffer {
  while (true) {
    const nonce = randomBytes(64)
    if (nonce[0] === 0xef) continue
    if (nonce.subarray(4, 8).equals(Buffer.alloc(4, 0))) continue

    const prefix = nonce.subarray(0, 4)
    let invalidPrefix = false
    for (const res of RESERVED_PREFIXES) {
      if (prefix.equals(res)) {
        invalidPrefix = true
        break
      }
    }
    if (invalidPrefix) continue

    return nonce
  }
}

export abstract class TCPObfuscated extends TCP {
  protected cipher: Cipher | null = null
  protected decipher: Decipher | null = null
  protected abstract obfuscateTag: Buffer

  protected override async onConnected(): Promise<void> {
    if (!this.socket) return

    const nonce = generateObfuscated2Nonce()
    this.obfuscateTag.copy(nonce, 56, 0, 4)

    // Reversed tail bytes 55 down to 8 (48 bytes)
    const reversedTail = Buffer.allocUnsafe(48)
    for (let i = 0; i < 48; i++) {
      reversedTail[i] = nonce[55 - i]
    }

    const encryptKey = Buffer.from(nonce.subarray(8, 40))
    const encryptIv = Buffer.from(nonce.subarray(40, 56))

    const decryptKey = Buffer.from(reversedTail.subarray(0, 32))
    const decryptIv = Buffer.from(reversedTail.subarray(32, 48))

    this.cipher = createCipheriv('aes-256-ctr', encryptKey, encryptIv)
    this.cipher.setAutoPadding(false)

    this.decipher = createDecipheriv('aes-256-ctr', decryptKey, decryptIv)
    this.decipher.setAutoPadding(false)

    // Encrypt initial 64-byte nonce to advance CTR state to byte 64
    const encryptedNonce = this.cipher.update(nonce)

    // Header sent on wire: nonce with bytes [56:64] replaced by encrypted bytes [56:64]
    const header = Buffer.from(nonce)
    encryptedNonce.subarray(56, 64).copy(header, 56)

    await new Promise<void>((resolve, reject) => {
      this.socket!.write(header, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  protected writeEncrypted(data: Buffer): Promise<void> {
    if (!this.socket || !this._connected || !this.cipher) {
      throw new Error('TCPObfuscated: socket or cipher not ready')
    }

    const encrypted = this.cipher.update(data)
    return new Promise((resolve, reject) => {
      this.socket!.write(encrypted, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  protected decryptChunk(chunk: Buffer): Buffer {
    if (!this.decipher) {
      throw new Error('TCPObfuscated: decipher not ready')
    }
    return this.decipher.update(chunk)
  }
}

export class TCPAbridgedO extends TCPObfuscated {
  protected override obfuscateTag = TCPAbridged.OBFUSCATE_TAG

  public override async send(data: Buffer): Promise<void> {
    const length = data.length / 4
    let header: Buffer

    if (length <= 126) {
      header = Buffer.from([length])
    } else {
      header = Buffer.alloc(4)
      header[0] = 0x7f
      header.writeUIntLE(length, 1, 3)
    }

    const framed = Buffer.concat([header, data])
    return this.writeEncrypted(framed)
  }

  protected override onRawData(chunk: Buffer): void {
    const decryptedChunk = this.decryptChunk(chunk)
    this._buffer = Buffer.concat([this._buffer, decryptedChunk])

    while (this._buffer.length > 0) {
      const firstByte = this._buffer[0]
      let headerLength = 1
      let payloadLength = 0

      if (firstByte === 0x7f) {
        if (this._buffer.length < 4) return
        headerLength = 4
        payloadLength = this._buffer.readUIntLE(1, 3) * 4
      } else {
        payloadLength = firstByte * 4
      }

      const totalLength = headerLength + payloadLength
      if (this._buffer.length < totalLength) return

      const payload = Buffer.from(this._buffer.subarray(headerLength, totalLength))
      this._buffer = Buffer.from(this._buffer.subarray(totalLength))

      this.emit('payload', payload)
    }
  }
}

export class TCPIntermediateO extends TCPObfuscated {
  protected override obfuscateTag = TCPIntermediate.OBFUSCATE_TAG

  public override async send(data: Buffer): Promise<void> {
    const header = Buffer.alloc(4)
    header.writeUInt32LE(data.length, 0)

    const framed = Buffer.concat([header, data])
    return this.writeEncrypted(framed)
  }

  protected override onRawData(chunk: Buffer): void {
    const decryptedChunk = this.decryptChunk(chunk)
    this._buffer = Buffer.concat([this._buffer, decryptedChunk])

    while (this._buffer.length >= 4) {
      const payloadLength = this._buffer.readUInt32LE(0)
      const totalLength = 4 + payloadLength

      if (this._buffer.length < totalLength) return

      const payload = Buffer.from(this._buffer.subarray(4, totalLength))
      this._buffer = Buffer.from(this._buffer.subarray(totalLength))

      this.emit('payload', payload)
    }
  }
}
