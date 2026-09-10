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

import { describe, it, expect } from 'vitest'
import { ige256Encrypt, ige256Decrypt, ctr256Encrypt, ctr256Decrypt } from '../src/crypto/aes.js'
import { factorizePQ, gcd } from '../src/crypto/prime.js'
import { kdf, sha1, sha256 } from '../src/crypto/mtproto.js'
import { rsaEncrypt, SERVER_PUBLIC_KEYS } from '../src/crypto/rsa.js'

describe('AES-256-IGE & CTR', () => {
  it('should encrypt and decrypt data roundtrip in AES-256-IGE mode', () => {
    const key = Buffer.alloc(32, 0x01)
    const iv = Buffer.alloc(32, 0x02)
    const plaintext = Buffer.from('Nectogram MTProto AES-IGE Encryption Test Payload Buffer!!', 'utf8') // 58 bytes -> pad to 64 bytes
    const padded = Buffer.concat([plaintext, Buffer.alloc(64 - plaintext.length)])

    const encrypted = ige256Encrypt(padded, key, iv)
    expect(encrypted).not.toEqual(padded)
    expect(encrypted.length).toBe(64)

    const decrypted = ige256Decrypt(encrypted, key, iv)
    expect(decrypted).toEqual(padded)
  })

  it('should encrypt and decrypt data roundtrip in AES-256-CTR mode', () => {
    const key = Buffer.alloc(32, 0x05)
    const iv = Buffer.alloc(16, 0x06)
    const data = Buffer.from('Obfuscated Transport Test Payload', 'utf8')

    const encrypted = ctr256Encrypt(data, key, iv)
    expect(encrypted).not.toEqual(data)

    const decrypted = ctr256Decrypt(encrypted, key, iv)
    expect(decrypted).toEqual(data)
  })
})

describe('PQ Factorization (Pollard Rho-Brent)', () => {
  it('should calculate GCD correctly', () => {
    expect(gcd(12n, 18n)).toBe(6n)
    expect(gcd(101n, 103n)).toBe(1n)
  })

  it('should factorize small PQ values', () => {
    const { p, q } = factorizePQ(15n)
    expect(p).toBe(3n)
    expect(q).toBe(5n)
  })

  it('should factorize a real Telegram 64-bit PQ value', () => {
    const pqHex = '17ed48941a08f981'
    const pq = BigInt('0x' + pqHex)
    const { p, q } = factorizePQ(pq)

    expect(p * q).toBe(pq)
    expect(p < q).toBe(true)
  })
})

describe('MTProto v2.0 KDF & Hashes', () => {
  it('should generate valid SHA1 and SHA256 hashes', () => {
    const data = Buffer.from('Telegram MTProto 2.0', 'utf8')
    expect(sha1(data).length).toBe(20)
    expect(sha256(data).length).toBe(32)
  })

  it('should derive 32-byte key and 32-byte IV using MTProto KDF', () => {
    const authKey = Buffer.from(Array.from({ length: 256 }, (_, i) => (i * 7 + 13) & 0xff))
    const msgKey = Buffer.from(Array.from({ length: 16 }, (_, i) => (i * 3 + 5) & 0xff))

    const outgoingKdf = kdf(authKey, msgKey, true)
    expect(outgoingKdf.key.length).toBe(32)
    expect(outgoingKdf.iv.length).toBe(32)

    const incomingKdf = kdf(authKey, msgKey, false)
    expect(incomingKdf.key.length).toBe(32)
    expect(incomingKdf.iv.length).toBe(32)
    expect(incomingKdf.key).not.toEqual(outgoingKdf.key)
  })
})

describe('RSA Encryption', () => {
  it('should encrypt payload using Telegram public key fingerprint', () => {
    const fingerprint = -4344800451088585951n
    const key = SERVER_PUBLIC_KEYS.get(fingerprint)
    expect(key).toBeDefined()

    const data = Buffer.alloc(128, 0x42)
    const encrypted = rsaEncrypt(data, fingerprint)
    expect(encrypted.length).toBe(256)
  })
})
