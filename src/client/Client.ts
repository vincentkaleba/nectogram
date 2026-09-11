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
import {
  Dispatcher,
  Handler,
  MessageHandler,
  CallbackQueryHandler,
  EditedMessageHandler,
  InlineQueryHandler,
  ChosenInlineResultHandler,
  ChatMemberUpdatedHandler,
  ChatJoinRequestHandler,
  MessageReactionHandler,
  MessageReactionCountHandler,
  PollHandler,
  StoryHandler,
  PreCheckoutQueryHandler,
  ShippingQueryHandler,
  UserStatusHandler,
  DeletedMessagesHandler,
  ConnectHandler,
  DisconnectHandler,
  RawUpdateHandler,
  ErrorHandler,
} from '../dispatcher/index.js'
import { Filter } from '../filters.js'
import { User, Message } from '../types/index.js'
import { PeerResolver } from './PeerResolver.js'

import {
  getMe,
  signInBot,
  sendMessage,
  editMessageText,
  deleteMessages,
  forwardMessages,
  sendChatAction,
  getChat,
  getChatMembers,
  answerCallbackQuery,
} from './methods/index.js'

import { parseText, ParseMode } from '../parser/index.js'

export interface ClientOptions {
  name?: string
  apiId: number
  apiHash: string
  botToken?: string
  sessionString?: string
  storage?: Storage
  testMode?: boolean
  inMemory?: boolean
  workers?: number
  noUpdates?: boolean
  sleepThreshold?: number
  maxMessageCacheSize?: number
  parseMode?: ParseMode
  appVersion?: string
  deviceModel?: string
  systemVersion?: string
  systemLangCode?: string
  langPack?: string
  langCode?: string
}

export class Client {
  public readonly name: string
  public readonly apiId: number
  public readonly apiHash: string
  public readonly botToken?: string
  public readonly testMode: boolean
  public readonly workers: number
  public readonly noUpdates: boolean
  public readonly sleepThreshold: number
  public readonly maxMessageCacheSize: number
  public parseMode: ParseMode
  public appVersion: string
  public deviceModel: string
  public systemVersion: string
  public systemLangCode: string
  public langPack: string
  public langCode: string

  public storage: Storage
  public connection?: Connection
  public session?: Session
  public dispatcher: Dispatcher
  public peerResolver: PeerResolver

  public me?: User
  public isConnected: boolean = false
  public readonly usersCache: Map<bigint, User> = new Map()

  constructor(options: ClientOptions) {
    this.name = options.name ?? 'nectogram'
    this.apiId = options.apiId
    this.apiHash = options.apiHash
    this.botToken = options.botToken
    this.testMode = options.testMode ?? false
    this.workers = options.workers ?? 16
    this.noUpdates = options.noUpdates ?? false
    this.sleepThreshold = options.sleepThreshold ?? 10
    this.maxMessageCacheSize = options.maxMessageCacheSize ?? 1000
    this.parseMode = options.parseMode ?? ParseMode.MARKDOWN
    this.appVersion = options.appVersion ?? '1.0.0'
    this.deviceModel = options.deviceModel ?? 'Node.js'
    this.systemVersion = options.systemVersion ?? process.version
    this.systemLangCode = options.systemLangCode ?? 'en'
    this.langPack = options.langPack ?? ''
    this.langCode = options.langCode ?? 'en'

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

    if (!authKey) {
      const hsConnection = new Connection({ dcId, testMode: this.testMode })
      await hsConnection.connect()
      const handshake = new Handshake(hsConnection)
      const hsRes = await handshake.execute()
      authKey = hsRes.authKey
      await this.storage.setAuthKey(authKey)
      hsConnection.close()
    }

    this.connection = new Connection({
      dcId,
      testMode: this.testMode,
    })

    this.session = new Session(this.connection, authKey)
    await this.session.start()

    // Bind incoming session updates to dispatcher and storage
    this.session.on('update', (update: any, users: Map<bigint, any>, chats: Map<bigint, any>) => {
      this._savePeersFromUpdate(users, chats).catch((err) => {
        console.error('Error saving peers from update:', err)
      })
      this.dispatcher.feedUpdate(update, users, chats)
    })

    this.isConnected = true

    // Initialize MTProto connection session with Layer & Client info
    try {
      await this.invoke(
        new raw.functions.InvokeWithLayer(
          raw.layer,
          new raw.functions.InitConnection(
            this.apiId,
            this.deviceModel,
            this.systemVersion,
            this.appVersion,
            this.systemLangCode,
            this.langPack,
            this.langCode,
            new raw.functions.help.GetConfig()
          )
        )
      )
    } catch (err: any) {
      if (err && typeof err.value === 'string' && (err.value.startsWith('USER_MIGRATE_') || err.value.startsWith('PHONE_MIGRATE_'))) {
        const targetDc = Number(err.value.split('_')[2])
        if (!isNaN(targetDc) && targetDc > 0) {
          console.log(`🔄 Migrating connection to target DC ${targetDc}...`)
          this.isConnected = false
          if (this.session) {
            await this.session.stop()
            this.session = undefined
          }
          if (this.connection) {
            await this.connection.close()
            this.connection = undefined
          }
          await this.storage.setDcId(targetDc)
          await this.storage.setAuthKey(null)
          return await this.connect()
        }
      }
      throw err
    }
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
   * Start the client: connect, perform auto-login if botToken provided, fetch self user info (getMe), and start update dispatcher.
   */
  public async start(): Promise<User> {
    await this.connect()

    if (this.botToken) {
      try {
        const isBot = await this.storage.getIsBot()
        const userId = await this.storage.getUserId()
        if (!isBot || !userId) {
          await this.signInBot(this.botToken)
        }
      } catch {
        await this.signInBot(this.botToken)
      }
    }

    const selfUser = await this.getMe()
    if (!this.noUpdates) {
      this.dispatcher.start()
    }
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
   * Restart the client session and dispatcher.
   */
  public async restart(): Promise<User> {
    await this.stop()
    return await this.start()
  }

  /**
   * Run the client: start, execute optional startup callback, and wait for SIGINT/SIGTERM signals to gracefully stop.
   */
  public async run(callback?: (client: Client) => any): Promise<void> {
    await this.start()
    if (callback) {
      await callback(this)
    }
    return new Promise<void>((resolve) => {
      const shutdown = async () => {
        process.off('SIGINT', shutdown)
        process.off('SIGTERM', shutdown)
        await this.stop()
        resolve()
      }
      process.on('SIGINT', shutdown)
      process.on('SIGTERM', shutdown)
    })
  }

  /**
   * Invoke a raw TL query via the MTProto session.
   */
  public async invoke<T = any>(query: raw.TLObject, retries: number = 3): Promise<T> {
    if (!this.session) {
      throw new Error('Client: Cannot invoke query when client is disconnected')
    }
    const res = await this.session.invoke<T>(query, retries)
    if (res && typeof res === 'object') {
      if ('users' in res || 'chats' in res) {
        this._savePeersFromUpdate((res as any).users, (res as any).chats).catch(() => {})
      }
    }
    return res
  }

  private async _savePeersFromUpdate(users?: Map<bigint, any> | any[], chats?: Map<bigint, any> | any[]): Promise<void> {
    if (users) {
      const userList = users instanceof Map ? Array.from(users.values()) : users
      for (const u of userList) {
        if (u && u.id !== undefined) {
          const userId = BigInt(u.id)
          const accessHash = u.access_hash !== undefined ? BigInt(u.access_hash) : 0n
          await this.storage.updatePeer({
            id: userId,
            accessHash,
            type: 'user',
            username: u.username,
            phone: u.phone,
            firstName: u.first_name ?? u.firstName,
            lastName: u.last_name ?? u.lastName,
          })
          if (u instanceof raw.types.User) {
            this.usersCache.set(userId, User._parse(u))
          } else if (u instanceof User) {
            this.usersCache.set(userId, u)
          }
        }
      }
    }
    if (chats) {
      const chatList = chats instanceof Map ? Array.from(chats.values()) : chats
      for (const c of chatList) {
        if (c && c.id !== undefined) {
          const chatId = BigInt(c.id)
          const accessHash = c.access_hash !== undefined ? BigInt(c.access_hash) : 0n
          const isChannel = c.QUALNAME === 'types.Channel' || (c.constructor && c.constructor.name === 'Channel')
          await this.storage.updatePeer({
            id: chatId,
            accessHash,
            type: isChannel ? 'channel' : 'chat',
            username: c.username,
            title: c.title,
          })
        }
      }
    }
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

  private _resolveHandlerArgs(filter?: any, callback?: any): { cb: any; flt: any } {
    const cb = typeof filter === 'function' ? filter : callback
    const flt = typeof filter === 'function' ? undefined : filter
    return { cb, flt }
  }

  public onMessage(filter?: Filter | ((client: Client, message: Message) => any), callback?: (client: Client, message: Message) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new MessageHandler(cb, flt))
  }

  public onEditedMessage(filter?: Filter | ((client: Client, message: Message) => any), callback?: (client: Client, message: Message) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new EditedMessageHandler(cb, flt))
  }

  public onCallbackQuery(filter?: Filter | ((client: Client, query: any) => any), callback?: (client: Client, query: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new CallbackQueryHandler(cb, flt))
  }

  public onInlineQuery(filter?: Filter | ((client: Client, query: any) => any), callback?: (client: Client, query: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new InlineQueryHandler(cb, flt))
  }

  public onChosenInlineResult(filter?: Filter | ((client: Client, result: any) => any), callback?: (client: Client, result: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new ChosenInlineResultHandler(cb, flt))
  }

  public onChatMemberUpdated(filter?: Filter | ((client: Client, update: any) => any), callback?: (client: Client, update: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new ChatMemberUpdatedHandler(cb, flt))
  }

  public onChatJoinRequest(filter?: Filter | ((client: Client, request: any) => any), callback?: (client: Client, request: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new ChatJoinRequestHandler(cb, flt))
  }

  public onMessageReaction(filter?: Filter | ((client: Client, reaction: any) => any), callback?: (client: Client, reaction: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new MessageReactionHandler(cb, flt))
  }

  public onPoll(filter?: Filter | ((client: Client, poll: any) => any), callback?: (client: Client, poll: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new PollHandler(cb, flt))
  }

  public onStory(filter?: Filter | ((client: Client, story: any) => any), callback?: (client: Client, story: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new StoryHandler(cb, flt))
  }

  public onPreCheckoutQuery(filter?: Filter | ((client: Client, query: any) => any), callback?: (client: Client, query: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new PreCheckoutQueryHandler(cb, flt))
  }

  public onShippingQuery(filter?: Filter | ((client: Client, query: any) => any), callback?: (client: Client, query: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new ShippingQueryHandler(cb, flt))
  }

  public onUserStatus(filter?: Filter | ((client: Client, status: any) => any), callback?: (client: Client, status: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new UserStatusHandler(cb, flt))
  }

  public onDeletedMessages(filter?: Filter | ((client: Client, messages: any) => any), callback?: (client: Client, messages: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new DeletedMessagesHandler(cb, flt))
  }

  public onConnect(callback: (client: Client) => any): void {
    this.addHandler(new ConnectHandler(callback))
  }

  public onDisconnect(callback: (client: Client) => any): void {
    this.addHandler(new DisconnectHandler(callback))
  }

  public onRawUpdate(filter?: Filter | ((client: Client, update: any) => any), callback?: (client: Client, update: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new RawUpdateHandler(cb, flt))
  }

  public onError(filter?: Filter | ((client: Client, error: any) => any), callback?: (client: Client, error: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new ErrorHandler(cb, flt))
  }

  // API Methods
  public getMe = getMe.bind(this)
  public signInBot = signInBot.bind(this)
  public sendMessage = sendMessage.bind(this)
  public editMessageText = editMessageText.bind(this)
  public deleteMessages = deleteMessages.bind(this)
  public forwardMessages = forwardMessages.bind(this)
  public sendChatAction = sendChatAction.bind(this)
  public getChat = getChat.bind(this)
  public getChatMembers = getChatMembers.bind(this)
  public answerCallbackQuery = answerCallbackQuery.bind(this)
}
