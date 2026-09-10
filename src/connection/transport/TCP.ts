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

import { Socket } from 'node:net'
import { EventEmitter } from 'node:events'

export interface TCPConnectOptions {
  host: string
  port: number
  dcId?: number
  timeout?: number
}

/**
 * Base abstract class for TCP MTProto transports.
 */
export abstract class TCP extends EventEmitter {
  public socket: Socket | null = null
  public host: string = ''
  public port: number = 0
  public dcId: number = 1
  public timeout: number = 10000
  protected _connected: boolean = false
  protected _buffer: Buffer = Buffer.alloc(0)

  constructor() {
    super()
  }

  public get isConnected(): boolean {
    return this._connected && this.socket !== null && !this.socket.destroyed
  }

  /**
   * Open TCP connection to target host and port.
   */
  public async connect(options: TCPConnectOptions): Promise<void> {
    this.host = options.host
    this.port = options.port
    if (options.dcId !== undefined) this.dcId = options.dcId
    if (options.timeout !== undefined) this.timeout = options.timeout

    return new Promise((resolve, reject) => {
      const socket = new Socket()
      this.socket = socket

      socket.setTimeout(this.timeout)

      const onConnect = async () => {
        cleanup()
        this._connected = true
        try {
          await this.onConnected()
          resolve()
        } catch (err) {
          this.close()
          reject(err)
        }
      }

      const onError = (err: Error) => {
        cleanup()
        this.close()
        reject(err)
      }

      const onTimeout = () => {
        cleanup()
        this.close()
        reject(new Error(`TCP connection to ${this.host}:${this.port} timed out`))
      }

      const cleanup = () => {
        socket.removeListener('connect', onConnect)
        socket.removeListener('error', onError)
        socket.removeListener('timeout', onTimeout)
      }

      socket.on('connect', onConnect)
      socket.on('error', onError)
      socket.on('timeout', onTimeout)

      socket.on('data', (chunk: Buffer) => {
        this.onRawData(chunk)
      })

      socket.on('close', () => {
        this._connected = false
        this.emit('close')
      })

      socket.connect(this.port, this.host)
    })
  }

  /**
   * Hook called right after TCP handshake succeeds.
   * Transports override this to send opening header bytes (e.g. 0xef or Obfuscated2 header).
   */
  protected async onConnected(): Promise<void> {}

  /**
   * Handle incoming raw bytes from socket.
   */
  protected abstract onRawData(chunk: Buffer): void

  /**
   * Send framed MTProto payload over the socket.
   */
  public abstract send(data: Buffer): Promise<void>

  /**
   * Close socket connection.
   */
  public close(): void {
    this._connected = false
    if (this.socket) {
      this.socket.destroy()
      this.socket = null
    }
    this._buffer = Buffer.alloc(0)
  }
}
