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

import { createCipheriv, createDecipheriv } from 'node:crypto'

function xor(a: Buffer, b: Buffer): Buffer {
  const out = Buffer.allocUnsafe(16)
  for (let i = 0; i < 16; i++) {
    out[i] = a[i] ^ b[i]
  }
  return out
}

function ecbEncryptBlock(block: Buffer, key: Buffer): Buffer {
  const cipher = createCipheriv('aes-256-ecb', key, null)
  cipher.setAutoPadding(false)
  return Buffer.concat([cipher.update(block), cipher.final()])
}

function ecbDecryptBlock(block: Buffer, key: Buffer): Buffer {
  const decipher = createDecipheriv('aes-256-ecb', key, null)
  decipher.setAutoPadding(false)
  return Buffer.concat([decipher.update(block), decipher.final()])
}

/**
 * Encrypt data using AES-256-IGE mode (MTProto standard payload encryption).
 */
export function ige256Encrypt(data: Buffer, key: Buffer, iv: Buffer): Buffer {
  if (data.length % 16 !== 0) {
    throw new RangeError(`ige256Encrypt: data length must be multiple of 16, got ${data.length}`)
  }
  if (key.length !== 32) {
    throw new RangeError(`ige256Encrypt: key must be 32 bytes, got ${key.length}`)
  }
  if (iv.length !== 32) {
    throw new RangeError(`ige256Encrypt: iv must be 32 bytes, got ${iv.length}`)
  }

  let iv1 = Buffer.from(iv.subarray(0, 16))
  let iv2 = Buffer.from(iv.subarray(16, 32))

  const blocksCount = data.length / 16
  const out = Buffer.allocUnsafe(data.length)

  for (let i = 0; i < blocksCount; i++) {
    const chunk = data.subarray(i * 16, i * 16 + 16)
    const encryptedBlock = xor(ecbEncryptBlock(xor(chunk, iv1), key), iv2)
    encryptedBlock.copy(out, i * 16)
    iv1 = Buffer.from(encryptedBlock)
    iv2 = Buffer.from(chunk)
  }

  return out
}

/**
 * Decrypt data using AES-256-IGE mode.
 */
export function ige256Decrypt(data: Buffer, key: Buffer, iv: Buffer): Buffer {
  if (data.length % 16 !== 0) {
    throw new RangeError(`ige256Decrypt: data length must be multiple of 16, got ${data.length}`)
  }
  if (key.length !== 32) {
    throw new RangeError(`ige256Decrypt: key must be 32 bytes, got ${key.length}`)
  }
  if (iv.length !== 32) {
    throw new RangeError(`ige256Decrypt: iv must be 32 bytes, got ${iv.length}`)
  }

  let iv1 = Buffer.from(iv.subarray(0, 16))
  let iv2 = Buffer.from(iv.subarray(16, 32))

  const blocksCount = data.length / 16
  const out = Buffer.allocUnsafe(data.length)

  for (let i = 0; i < blocksCount; i++) {
    const chunk = data.subarray(i * 16, i * 16 + 16)
    const decryptedBlock = xor(ecbDecryptBlock(xor(chunk, iv2), key), iv1)
    decryptedBlock.copy(out, i * 16)
    iv1 = Buffer.from(chunk)
    iv2 = Buffer.from(decryptedBlock)
  }

  return out
}

/**
 * Encrypt/Decrypt data using AES-256-CTR mode (obfuscated transport).
 */
export function ctr256Encrypt(data: Buffer, key: Buffer, iv: Buffer): Buffer {
  const cipher = createCipheriv('aes-256-ctr', key, iv)
  return Buffer.concat([cipher.update(data), cipher.final()])
}

export function ctr256Decrypt(data: Buffer, key: Buffer, iv: Buffer): Buffer {
  const decipher = createDecipheriv('aes-256-ctr', key, iv)
  return Buffer.concat([decipher.update(data), decipher.final()])
}
