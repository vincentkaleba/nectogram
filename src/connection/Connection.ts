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

import { EventEmitter } from 'node:events'
import { TCP, TCPAbridgedO } from './transport/index.js'

export interface DCOption {
  id: number
  ip: string
  port: number
}

export const DEFAULT_PRODUCTION_DCS: Record<number, DCOption> = {
  1: { id: 1, ip: '149.154.175.50', port: 443 },
  2: { id: 2, ip: '149.154.167.51', port: 443 },
  3: { id: 3, ip: '149.154.175.100', port: 443 },
  4: { id: 4, ip: '149.154.167.91', port: 443 },
  5: { id: 5, ip: '91.108.56.130', port: 443 },
}

export const DEFAULT_TEST_DCS: Record<number, DCOption> = {
  1: { id: 1, ip: '149.154.175.10', port: 443 },
  2: { id: 2, ip: '149.154.167.40', port: 443 },
  3: { id: 3, ip: '149.154.175.117', port: 443 },
}

export interface ConnectionOptions {
  dcId: number
  testMode?: boolean
  ip?: string
  port?: number
  transport?: TCP
  timeout?: number
}

/**
 * Manages the connection lifecycle to a Telegram DC endpoint over a specified TCP transport.
 */
export class Connection extends EventEmitter {
  public readonly dcId: number
  public readonly testMode: boolean
  public readonly ip: string
  public readonly port: number
  public readonly transport: TCP
  public readonly timeout: number

  private _onPayloadBound: (payload: Buffer) => void
  private _onCloseBound: () => void

  constructor(options: ConnectionOptions) {
    super()
    this.dcId = options.dcId
    this.testMode = options.testMode ?? false

    const defaultDcs = this.testMode ? DEFAULT_TEST_DCS : DEFAULT_PRODUCTION_DCS
    const defaultOption = defaultDcs[this.dcId] ?? { id: this.dcId, ip: '149.154.167.51', port: 443 }

    this.ip = options.ip ?? defaultOption.ip
    this.port = options.port ?? defaultOption.port
    this.transport = options.transport ?? new TCPAbridgedO()
    this.timeout = options.timeout ?? 10000

    this._onPayloadBound = (payload: Buffer) => {
      this.emit('payload', payload)
    }

    this._onCloseBound = () => {
      this.emit('close')
    }
  }

  public get isConnected(): boolean {
    return this.transport.isConnected
  }

  /**
   * Connect to Telegram DC.
   */
  public async connect(): Promise<void> {
    this.transport.on('payload', this._onPayloadBound)
    this.transport.on('close', this._onCloseBound)

    await this.transport.connect({
      host: this.ip,
      port: this.port,
      dcId: this.dcId,
      timeout: this.timeout,
    })
  }

  /**
   * Send payload to Telegram DC.
   */
  public async send(data: Buffer): Promise<void> {
    return this.transport.send(data)
  }

  /**
   * Close connection.
   */
  public close(): void {
    this.transport.removeListener('payload', this._onPayloadBound)
    this.transport.removeListener('close', this._onCloseBound)
    this.transport.close()
  }
}
