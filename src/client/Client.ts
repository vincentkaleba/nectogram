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

import * as raw from '../raw/index.js'
import { Storage, MemoryStorage, FileStorage } from '../storage/index.js'
import { Connection } from '../connection/Connection.js'
import { Session, AuthKey, Handshake } from '../session/index.js'
import { Dispatcher, Handler, MessageHandler, CallbackQueryHandler } from '../dispatcher/index.js'
import { Filter } from '../filters.js'
import { User, Message } from '../types/index.js'
import { PeerResolver } from './PeerResolver.js'

import {
  getMe,
  signInBot,
  sendMessage,
  editMessageText,
  deleteMessages,
  getChat,
} from './methods/index.js'

export interface ClientOptions {
  name?: string
  apiId: number
  apiHash: string
  sessionString?: string
  storage?: Storage
  testMode?: boolean
  inMemory?: boolean
  workers?: number
}

export class Client {
  public readonly name: string
  public readonly apiId: number
  public readonly apiHash: string
  public readonly testMode: boolean

  public storage: Storage
  public connection?: Connection
  public session?: Session
  public dispatcher: Dispatcher
  public peerResolver: PeerResolver

  public me?: User
  public isConnected: boolean = false

  constructor(options: ClientOptions) {
    this.name = options.name ?? 'nectogram'
    this.apiId = options.apiId
    this.apiHash = options.apiHash
    this.testMode = options.testMode ?? false

    if (options.storage) {
      this.storage = options.storage
    } else if (options.inMemory) {
      this.storage = new MemoryStorage()
    } else {
      this.storage = new FileStorage(this.name)
    }

    this.dispatcher = new Dispatcher(this)
    this.peerResolver = new PeerResolver(this.storage, (query) => this.invoke(query))

    if (options.sessionString) {
      this.storage.importSessionString(options.sessionString).catch((err) => {
        console.error('Client constructor: failed to import session string:', err)
      })
    }
  }

  /**
   * Connect to Telegram MTProto servers, perform Diffie-Hellman handshake if needed, and start MTProto Session.
   */
  public async connect(): Promise<void> {
    if (this.isConnected) return

    await this.storage.open()
    await this.storage.setApiId(this.apiId)
    await this.storage.setTestMode(this.testMode)

    const dcId = await this.storage.getDcId()
    let authKey = await this.storage.getAuthKey()

    this.connection = new Connection({
      dcId,
      testMode: this.testMode,
    })

    if (!authKey) {
      await this.connection.connect()
      const handshake = new Handshake(this.connection)
      const hsRes = await handshake.execute()
      authKey = hsRes.authKey
      await this.storage.setAuthKey(authKey)
      await this.connection.close()
    }

    this.session = new Session(this.connection, authKey)
    await this.session.start()

    // Bind incoming session updates to dispatcher
    this.session.on('update', (update: any, users: Map<bigint, any>, chats: Map<bigint, any>) => {
      this.dispatcher.feedUpdate(update, users, chats)
    })

    this.isConnected = true
  }

  /**
   * Disconnect from Telegram MTProto servers and save storage state.
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) return
    this.isConnected = false

    if (this.session) {
      await this.session.stop()
      this.session = undefined
    }

    if (this.connection) {
      await this.connection.close()
      this.connection = undefined
    }

    await this.storage.close()
  }

  /**
   * Start the client: connect, fetch self user info (getMe), and start update dispatcher.
   */
  public async start(): Promise<User> {
    await this.connect()
    const selfUser = await this.getMe()
    this.dispatcher.start()
    return selfUser
  }

  /**
   * Stop the client: stop dispatcher and disconnect session/socket.
   */
  public async stop(): Promise<void> {
    this.dispatcher.stop()
    await this.disconnect()
  }

  /**
   * Invoke a raw TL query via the MTProto session.
   */
  public async invoke<T = any>(query: raw.TLObject, retries: number = 3): Promise<T> {
    if (!this.session) {
      throw new Error('Client: Cannot invoke query when client is disconnected')
    }
    return await this.session.invoke<T>(query, retries)
  }

  /**
   * Export Pyrogram-compatible base64url session string.
   */
  public async exportSessionString(): Promise<string> {
    return await this.storage.exportSessionString()
  }

  // Dispatcher & Handler Decorators / Helpers
  public addHandler(handler: Handler, group: number = 0): void {
    this.dispatcher.addHandler(handler, group)
  }

  public removeHandler(handler: Handler, group: number = 0): void {
    this.dispatcher.removeHandler(handler, group)
  }

  public onMessage(filter?: Filter, callback?: (client: Client, message: Message) => any): void {
    if (typeof filter === 'function' && !callback) {
      callback = filter as any
      filter = undefined
    }
    if (callback) {
      this.addHandler(new MessageHandler(callback, filter))
    }
  }

  public onCallbackQuery(filter?: Filter, callback?: (client: Client, query: any) => any): void {
    if (typeof filter === 'function' && !callback) {
      callback = filter as any
      filter = undefined
    }
    if (callback) {
      this.addHandler(new CallbackQueryHandler(callback, filter))
    }
  }

  // API Methods
  public getMe = getMe.bind(this)
  public signInBot = signInBot.bind(this)
  public sendMessage = sendMessage.bind(this)
  public editMessageText = editMessageText.bind(this)
  public deleteMessages = deleteMessages.bind(this)
  public getChat = getChat.bind(this)
}
