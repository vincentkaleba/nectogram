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

import { randomBytes } from 'node:crypto'

export const CURRENT_DH_PRIME = BigInt(
  '0xC71CAEB9C6B1C9048E6C522F70F13F73980D40238E3E21C14934D037563D930F' +
  '48198A0AA7C14058229493D22530F4DBFA336F6E0AC925139543AED44CCE7C37' +
  '20FD51F69458705AC68CD4FE6B6B13ABDC9746512969328454F18FAF8C595F64' +
  '2477FE96BB2A941D5BCD1D4AC8CC49880708FA9B378E3C4F3A9060BEE67CF9A4' +
  'A4A695811051907E162753B56B0F6B410DBA74D8A84B2A14B3144E0EF1284754' +
  'FD17ED950D5965B4B9DD46582DB1178D169C6BC465B0D6FF9CA3928FEF5B9AE4' +
  'E418FC15E83EBEA0F87FA9FF5EED70050DED2849F47BF959D956850CE929851F' +
  '0D8115F635B105EE2E4E15D04B2454BF6F4FADF034B10403119CD8E3B92FCC5B'
)

export function gcd(a: bigint, b: bigint): bigint {
  while (b > 0n) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

function randBigInt(max: bigint): bigint {
  const bytesNeeded = Math.ceil(max.toString(16).length / 2)
  const buf = randomBytes(bytesNeeded)
  const val = BigInt('0x' + buf.toString('hex'))
  return (val % (max - 1n)) + 1n
}

function decompose(pq: bigint): bigint {
  const SMALL_PRIMES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n]
  for (const prime of SMALL_PRIMES) {
    if (pq % prime === 0n && pq > prime) return prime
  }

  let y = randBigInt(pq)
  let c = randBigInt(pq)
  let m = 100n

  let g = 1n
  let r = 1n
  let q = 1n
  let x = 0n
  let ys = 0n

  while (g === 1n) {
    x = y

    for (let i = 0n; i < r; i++) {
      y = (y * y + c) % pq
    }

    let k = 0n

    while (k < r && g === 1n) {
      ys = y
      const limit = m < (r - k) ? m : (r - k)

      for (let i = 0n; i < limit; i++) {
        y = (y * y + c) % pq
        const diff = x > y ? x - y : y - x
        q = (q * diff) % pq
      }

      g = gcd(q, pq)
      k += m
    }

    r *= 2n
  }

  if (g === pq) {
    while (true) {
      ys = (ys * ys + c) % pq
      const diff = x > ys ? x - ys : ys - x
      g = gcd(diff, pq)
      if (g > 1n) break
    }
  }

  return g
}

export function factorizePQ(pqVal: bigint | Buffer): { p: bigint; q: bigint } {
  const pq = typeof pqVal === 'bigint' ? pqVal : BigInt('0x' + pqVal.toString('hex'))
  const g = decompose(pq)
  const other = pq / g

  const p = g < other ? g : other
  const q = g < other ? other : g

  return { p, q }
}
