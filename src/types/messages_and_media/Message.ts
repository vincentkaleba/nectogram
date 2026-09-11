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
    rawMsg: raw.types.Message | any,
    usersMap?: Map<bigint, User>,
    chatsMap?: Map<bigint, Chat>
  ): Message {
    let fromUserId: bigint | undefined
    const fromId = rawMsg.from_id || rawMsg.fromId
    const fromIdQual = fromId?.QUALNAME || fromId?.constructor?.name
    if (fromId && (fromId instanceof raw.types.PeerUser || fromIdQual === 'types.PeerUser')) {
      fromUserId = BigInt(fromId.user_id ?? fromId.userId)
    }

    let fromUser: User | undefined
    if (fromUserId) {
      const u = usersMap?.get(fromUserId)
      fromUser = u ? (u instanceof User ? u : User._parse(u as any)) : new User({ id: fromUserId, isBot: false })
    }

    let chat: Chat
    const peerId = rawMsg.peer_id || rawMsg.peerId
    const peerQual = peerId?.QUALNAME || peerId?.constructor?.name
    if (peerId && (peerId instanceof raw.types.PeerUser || peerQual === 'types.PeerUser')) {
      const peerUserId = BigInt(peerId.user_id ?? peerId.userId)
      const chatId = (!rawMsg.out && fromUserId) ? fromUserId : peerUserId
      const u = usersMap?.get(chatId)
      const parsedUser = u ? (u instanceof User ? u : User._parse(u as any)) : undefined
      chat = new Chat({
        id: chatId,
        type: 'private',
        title: parsedUser?.fullName ?? parsedUser?.username,
        username: parsedUser?.username,
      })
    } else if (peerId && (peerId instanceof raw.types.PeerChannel || peerQual === 'types.PeerChannel')) {
      const channelId = BigInt(peerId.channel_id ?? peerId.channelId)
      const c = chatsMap?.get(channelId)
      chat = c ? (c instanceof Chat ? c : Chat._parse(c as any)) : new Chat({ id: channelId, type: 'channel' })
    } else if (peerId && (peerId instanceof raw.types.PeerChat || peerQual === 'types.PeerChat')) {
      const chatIdVal = BigInt(peerId.chat_id ?? peerId.chatId)
      const c = chatsMap?.get(chatIdVal)
      chat = c ? (c instanceof Chat ? c : Chat._parse(c as any)) : new Chat({ id: chatIdVal, type: 'group' })
    } else {
      const chatId = fromUserId ?? 0n
      chat = new Chat({ id: chatId, type: 'private' })
    }

    let replyToMessageId: number | undefined
    const replyToHeader = rawMsg.reply_to || rawMsg.replyTo
    const replyToQual = replyToHeader?.QUALNAME || replyToHeader?.constructor?.name
    if (replyToHeader && (replyToHeader instanceof raw.types.MessageReplyHeader || replyToQual === 'types.MessageReplyHeader')) {
      replyToMessageId = replyToHeader.reply_to_msg_id ?? replyToHeader.replyToMsgId
    }

    return new Message({
      id: rawMsg.id,
      fromUser,
      chat,
      date: new Date((rawMsg.date ?? 0) * 1000),
      text: rawMsg.message,
      replyToMessageId,
      raw: rawMsg,
    })
  }
}
