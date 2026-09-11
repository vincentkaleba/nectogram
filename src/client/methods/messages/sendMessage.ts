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

import * as raw from '../../../raw/index.js'
import { Message, InlineKeyboardMarkup } from '../../../types/index.js'
import { parseText, ParseMode } from '../../../parser/index.js'
import type { Client } from '../../Client.js'
import type { PeerLike } from '../../PeerResolver.js'

export interface SendMessageOptions {
  replyToMessageId?: number
  replyMarkup?: InlineKeyboardMarkup
  parseMode?: ParseMode
  entities?: raw.base.MessageEntity[]
  richMessage?: raw.base.InputRichMessage
}

export async function sendMessage(
  this: Client,
  chatId: PeerLike,
  text: string,
  options?: SendMessageOptions,
): Promise<Message> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  let cleanText = text
  let entities: raw.base.MessageEntity[] | undefined = options?.entities

  if (!entities && options?.parseMode !== 'raw') {
    const parsed = parseText(text, options?.parseMode ?? (this as any).parseMode ?? 'markdown')
    cleanText = parsed.text
    if (parsed.entities.length > 0) {
      entities = parsed.entities
    }
  }

  let replyTo: raw.base.InputReplyTo | undefined
  if (options?.replyToMessageId) {
    replyTo = new raw.types.InputReplyToMessage(options.replyToMessageId)
  }

  let replyMarkup: raw.base.ReplyMarkup | undefined
  if (options?.replyMarkup) {
    replyMarkup = options.replyMarkup.writeTL()
  }

  const randomId = BigInt(Math.floor(Math.random() * 1e12))

  const res = await this.invoke(
    new raw.functions.messages.SendMessage(
      peer,
      cleanText,
      randomId,
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      replyTo,
      replyMarkup,
      entities,
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      options?.richMessage
    )
  )

  const usersMap = new Map()
  const chatsMap = new Map()

  if (res && typeof res === 'object' && 'users' in res && Array.isArray((res as any).users)) {
    for (const u of (res as any).users) {
      if (u instanceof raw.types.User) {
        usersMap.set(u.id, u)
      }
    }
  }

  if (res && typeof res === 'object' && 'chats' in res && Array.isArray((res as any).chats)) {
    for (const c of (res as any).chats) {
      if (c instanceof raw.types.Chat || c instanceof raw.types.Channel) {
        chatsMap.set(c.id, c)
      }
    }
  }

  let rawMessage: raw.types.Message | undefined

  if (res instanceof raw.types.UpdateShortSentMessage) {
    rawMessage = new raw.types.Message(
      res.id,
      peer instanceof raw.types.InputPeerUser
        ? new raw.types.PeerUser(peer.user_id)
        : peer instanceof raw.types.InputPeerChannel
        ? new raw.types.PeerChannel(peer.channel_id)
        : peer instanceof raw.types.InputPeerChat
        ? new raw.types.PeerChat(peer.chat_id)
        : new raw.types.PeerUser(this.me?.id ?? 0n),
      res.date,
      text,
      true, // out
      false, false, false, false, false, false, false, false, false, false, false, false, false, false,
      new raw.types.PeerUser(this.me?.id ?? 0n),
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      replyTo ? new raw.types.MessageReplyHeader(false, false, false, false, options!.replyToMessageId!) : undefined,
      res.media,
      replyMarkup,
      res.entities
    )
  } else if (res && typeof res === 'object' && 'updates' in res && Array.isArray((res as any).updates)) {
    for (const u of (res as any).updates) {
      if (u instanceof raw.types.UpdateNewMessage || u instanceof raw.types.UpdateNewChannelMessage) {
        if (u.message instanceof raw.types.Message) {
          rawMessage = u.message
          break
        }
      }
    }
  }

  if (rawMessage) {
    return Message._parse(rawMessage, usersMap, chatsMap)
  }

  throw new Error('sendMessage: Failed to parse sent message update from server response')
}
