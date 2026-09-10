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

import * as raw from '../../raw/index.js'
import { User } from '../user_and_chats/User.js'
import { Chat } from '../user_and_chats/Chat.js'

export interface MessageOptions {
  id: number
  fromUser?: User
  chat: Chat
  date: Date
  text?: string
  replyToMessageId?: number
  raw?: raw.types.Message
}

/**
 * High-level representation of a Telegram message.
 */
export class Message {
  public readonly id: number
  public readonly fromUser?: User
  public readonly chat: Chat
  public readonly date: Date
  public readonly text?: string
  public readonly replyToMessageId?: number
  public readonly raw?: raw.types.Message
  public command?: string[]
  public matches?: any[]

  constructor(options: MessageOptions) {
    this.id = options.id
    this.fromUser = options.fromUser
    this.chat = options.chat
    this.date = options.date
    this.text = options.text
    this.replyToMessageId = options.replyToMessageId
    this.raw = options.raw
  }

  /**
   * Parse a raw TL Message object into a high-level Message instance.
   */
  public static _parse(
    rawMsg: raw.types.Message,
    usersMap?: Map<bigint, User>,
    chatsMap?: Map<bigint, Chat>
  ): Message {
    let fromUser: User | undefined
    if (rawMsg.from_id && rawMsg.from_id instanceof raw.types.PeerUser) {
      const u = usersMap?.get(rawMsg.from_id.user_id)
      if (u) {
        fromUser = u instanceof User ? u : User._parse(u as any)
      } else {
        fromUser = new User({ id: rawMsg.from_id.user_id, isBot: false })
      }
    }

    let chat: Chat
    if (rawMsg.peer_id instanceof raw.types.PeerUser) {
      const u = usersMap?.get(rawMsg.peer_id.user_id)
      const parsedUser = u ? (u instanceof User ? u : User._parse(u as any)) : undefined
      chat = new Chat({
        id: rawMsg.peer_id.user_id,
        type: 'private',
        title: parsedUser?.fullName ?? parsedUser?.username,
        username: parsedUser?.username,
      })
    } else if (rawMsg.peer_id instanceof raw.types.PeerChannel) {
      const c = chatsMap?.get(rawMsg.peer_id.channel_id)
      chat = c ? (c instanceof Chat ? c : Chat._parse(c as any)) : new Chat({ id: rawMsg.peer_id.channel_id, type: 'channel' })
    } else if (rawMsg.peer_id instanceof raw.types.PeerChat) {
      const c = chatsMap?.get(rawMsg.peer_id.chat_id)
      chat = c ? (c instanceof Chat ? c : Chat._parse(c as any)) : new Chat({ id: rawMsg.peer_id.chat_id, type: 'group' })
    } else {
      chat = new Chat({ id: 0n, type: 'private' })
    }

    let replyToMessageId: number | undefined
    if (rawMsg.reply_to && rawMsg.reply_to instanceof raw.types.MessageReplyHeader) {
      replyToMessageId = rawMsg.reply_to.reply_to_msg_id
    }

    return new Message({
      id: rawMsg.id,
      fromUser,
      chat,
      date: new Date(rawMsg.date * 1000),
      text: rawMsg.message,
      replyToMessageId,
      raw: rawMsg,
    })
  }
}
