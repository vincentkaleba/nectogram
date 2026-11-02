//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../raw/index.js'
import { User } from '../user_and_chats/User.js'
import { Chat } from '../user_and_chats/Chat.js'
import { Message } from '../messages_and_media/Message.js'

export interface CallbackQueryOptions {
  id: string
  fromUser: User
  message?: Message
  data?: string
  chatInstance?: bigint
  raw?: raw.types.UpdateBotCallbackQuery | raw.types.UpdateInlineBotCallbackQuery
  client?: any
}

/**
 * High-level representation of an incoming callback query (inline button click).
 */
export class CallbackQuery {
  public readonly id: string
  public readonly fromUser: User
  public readonly message?: Message
  public readonly data?: string
  public readonly chatInstance?: bigint
  public readonly raw?: raw.types.UpdateBotCallbackQuery | raw.types.UpdateInlineBotCallbackQuery
  public matches?: any[]
  public _client?: any

  constructor(options: CallbackQueryOptions) {
    this.id = options.id.toString()
    this.fromUser = options.fromUser
    this.message = options.message
    this.data = options.data
    this.chatInstance = options.chatInstance
    this.raw = options.raw
    this._client = options.client
  }

  // Pyrogram snake_case aliases
  public get from_user(): User {
    return this.fromUser
  }
  public get chat_instance(): bigint | undefined {
    return this.chatInstance
  }

  /**
   * Answer this callback query.
   */
  public async answer(
    textOrOptions?: string | { text?: string; showAlert?: boolean; url?: string; cacheTime?: number },
    options?: { showAlert?: boolean; url?: string; cacheTime?: number }
  ): Promise<boolean> {
    if (!this._client) {
      throw new Error('CallbackQuery: Cannot call answer() because client reference is missing.')
    }
    if (typeof textOrOptions === 'string') {
      return await this._client.answerCallbackQuery(this.id, { text: textOrOptions, ...options })
    }
    return await this._client.answerCallbackQuery(this.id, textOrOptions)
  }

  /**
   * Edit the message that originated this callback query.
   */
  public async editMessage(text: string, options?: any): Promise<Message> {
    if (!this._client) {
      throw new Error('CallbackQuery: Cannot call editMessage() because client reference is missing.')
    }
    if (!this.message) {
      throw new Error('CallbackQuery: Cannot edit message because message property is undefined.')
    }
    return await this.message.edit(text, options)
  }

  /**
   * Delete the message that originated this callback query.
   */
  public async deleteMessage(): Promise<boolean> {
    if (!this._client) {
      throw new Error('CallbackQuery: Cannot call deleteMessage() because client reference is missing.')
    }
    if (!this.message) {
      throw new Error('CallbackQuery: Cannot delete message because message property is undefined.')
    }
    return await this.message.delete()
  }

  /**
   * Parse a raw TL UpdateBotCallbackQuery object into a CallbackQuery.
   */
  public static _parse(
    rawUpdate: raw.types.UpdateBotCallbackQuery | any,
    usersMap?: Map<bigint, User>,
    chatsMap?: Map<bigint, Chat>,
    client?: any
  ): CallbackQuery {
    const fromUser = usersMap?.get(rawUpdate.user_id ?? rawUpdate.userId) ?? new User({ id: rawUpdate.user_id ?? rawUpdate.userId })
    const data = rawUpdate.data ? (Buffer.isBuffer(rawUpdate.data) ? rawUpdate.data.toString('utf8') : String(rawUpdate.data)) : undefined

    let message: Message | undefined
    if (rawUpdate.message && (rawUpdate.message instanceof raw.types.Message || rawUpdate.message?.QUALNAME === 'types.Message')) {
      message = Message._parse(rawUpdate.message, usersMap, chatsMap, client)
    } else if (rawUpdate.msg_id !== undefined || rawUpdate.msgId !== undefined) {
      const msgId = rawUpdate.msg_id ?? rawUpdate.msgId
      const peer = rawUpdate.peer
      let chatId = 0n
      let chatType: any = 'private'
      let chatTitle: string | undefined

      if (peer) {
        const peerQual = peer?.QUALNAME || peer?.constructor?.name || ''
        if (peer instanceof raw.types.PeerUser || peerQual.includes('PeerUser')) {
          chatId = BigInt(peer.user_id ?? peer.userId)
          chatType = 'private'
          const u = usersMap?.get(chatId)
          chatTitle = u?.fullName ?? u?.username
        } else if (peer instanceof raw.types.PeerChannel || peerQual.includes('PeerChannel')) {
          chatId = BigInt(peer.channel_id ?? peer.channelId)
          chatType = 'channel'
          const c = chatsMap?.get(chatId)
          chatTitle = c?.title
        } else if (peer instanceof raw.types.PeerChat || peerQual.includes('PeerChat')) {
          chatId = BigInt(peer.chat_id ?? peer.chatId)
          chatType = 'group'
          const c = chatsMap?.get(chatId)
          chatTitle = c?.title
        }
      }

      if (!chatId) {
        chatId = fromUser.id
      }

      const chat = new Chat({ id: chatId, type: chatType, title: chatTitle })
      message = new Message({
        id: msgId,
        chat,
        date: new Date(),
        client,
      })
    }

    return new CallbackQuery({
      id: rawUpdate.query_id ? rawUpdate.query_id.toString() : (rawUpdate.queryId ? rawUpdate.queryId.toString() : '0'),
      fromUser,
      message,
      data,
      chatInstance: rawUpdate.chat_instance ?? rawUpdate.chatInstance,
      raw: rawUpdate,
      client,
    })
  }
}
