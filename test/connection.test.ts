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

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer, Server, Socket } from 'node:net'
import {
  TCPAbridged,
  TCPIntermediate,
  TCPIntermediatePadded,
  TCPAbridgedO,
  TCPIntermediateO,
  generateObfuscated2Nonce,
  Connection
} from '../src/connection/index.js'

describe('Connection & Transports', () => {
  describe('Obfuscated2 Nonce Generator', () => {
    it('should generate valid 64-byte obfuscated2 nonce', () => {
      const nonce = generateObfuscated2Nonce()
      expect(nonce.length).toBe(64)
      expect(nonce[0]).not.toBe(0xef)
      expect(nonce.subarray(4, 8).equals(Buffer.alloc(4, 0))).toBe(false)
    })
  })

  describe('Local TCP Server Transport Integration', () => {
    let server: Server
    let serverPort: number
    let clientSocket: Socket | null = null

    beforeAll(async () => {
      server = createServer((socket) => {
        clientSocket = socket
      })

      await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', () => {
          const addr = server.address()
          if (typeof addr === 'object' && addr !== null) {
            serverPort = addr.port
          }
          resolve()
        })
      })
    })

    afterAll(async () => {
      if (clientSocket) clientSocket.destroy()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    })

    it('should connect and exchange payload via TCPAbridged', async () => {
      const transport = new TCPAbridged()
      const payloadPromise = new Promise<Buffer>((resolve) => {
        transport.once('payload', (payload) => resolve(payload))
      })

      await transport.connect({ host: '127.0.0.1', port: serverPort, timeout: 2000 })
      expect(transport.isConnected).toBe(true)

      // Send payload from client to server
      const testData = Buffer.from('Nectogram Abridged Transport Test Payload!', 'utf8') // 42 bytes (pad to 44 bytes = 11 words)
      const paddedData = Buffer.concat([testData, Buffer.alloc(44 - testData.length)])

      // Server echoes framed packet back to client
      clientSocket!.once('data', (data) => {
        // First byte is 0xef header
        expect(data[0]).toBe(0xef)
        // Next is framing: 11 words (0x0b) + payload
        expect(data[1]).toBe(11)
        // Echo back framed data excluding 0xef header
        clientSocket!.write(data.subarray(1))
      })

      await transport.send(paddedData)
      const received = await payloadPromise
      expect(received).toEqual(paddedData)

      transport.close()
    })

    it('should connect and exchange payload via TCPIntermediate', async () => {
      const transport = new TCPIntermediate()
      const payloadPromise = new Promise<Buffer>((resolve) => {
        transport.once('payload', (payload) => resolve(payload))
      })

      await transport.connect({ host: '127.0.0.1', port: serverPort, timeout: 2000 })
      expect(transport.isConnected).toBe(true)

      const testData = Buffer.from('Intermediate Transport Test Payload Vector', 'utf8')

      clientSocket!.once('data', (data) => {
        // First 4 bytes: 0xeeeeeeee
        expect(data.subarray(0, 4)).toEqual(Buffer.from([0xee, 0xee, 0xee, 0xee]))
        // Echo back framed data excluding 0xeeeeeeee header
        clientSocket!.write(data.subarray(4))
      })

      await transport.send(testData)
      const received = await payloadPromise
      expect(received).toEqual(testData)

      transport.close()
    })

    it('should manage connection via Connection class wrapper', () => {
      const conn = new Connection({ dcId: 2, testMode: true })
      expect(conn.dcId).toBe(2)
      expect(conn.ip).toBe('149.154.167.40')
      expect(conn.port).toBe(443)
      expect(conn.isConnected).toBe(false)
    })
  })
})
