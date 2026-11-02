//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../raw/index.js'
import { User } from '../user_and_chats/User.js'

export type MessageEntityType =
  | 'mention'
  | 'hashtag'
  | 'cashtag'
  | 'bot_command'
  | 'url'
  | 'email'
  | 'phone_number'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'spoiler'
  | 'blockquote'
  | 'code'
  | 'pre'
  | 'text_link'
  | 'text_mention'
  | 'custom_emoji'
  | 'unknown'

export interface MessageEntityOptions {
  type: MessageEntityType
  offset: number
  length: number
  url?: string
  user?: User
  language?: string
  customEmojiId?: string
  raw?: raw.TLObject
}

export class MessageEntity {
  public readonly type: MessageEntityType
  public readonly offset: number
  public readonly length: number
  public readonly url?: string
  public readonly user?: User
  public readonly language?: string
  public readonly customEmojiId?: string
  public readonly raw?: raw.TLObject

  constructor(options: MessageEntityOptions) {
    this.type = options.type
    this.offset = options.offset
    this.length = options.length
    this.url = options.url
    this.user = options.user
    this.language = options.language
    this.customEmojiId = options.customEmojiId
    this.raw = options.raw
  }

  public get custom_emoji_id(): string | undefined {
    return this.customEmojiId
  }

  public static _parse(rawEnt: any, usersMap?: Map<bigint, User>): MessageEntity {
    const qual = rawEnt?.QUALNAME || rawEnt?.constructor?.name || ''
    let type: MessageEntityType = 'unknown'
    let url: string | undefined
    let user: User | undefined
    let language: string | undefined
    let customEmojiId: string | undefined

    if (qual.includes('MessageEntityMentionName')) {
      type = 'text_mention'
      if (rawEnt.user_id || rawEnt.userId) {
        const uid = BigInt(rawEnt.user_id ?? rawEnt.userId)
        user = usersMap?.get(uid) ?? new User({ id: uid })
      }
    } else if (qual.includes('MessageEntityMention')) type = 'mention'
    else if (qual.includes('MessageEntityHashtag')) type = 'hashtag'
    else if (qual.includes('MessageEntityCashtag')) type = 'cashtag'
    else if (qual.includes('MessageEntityBotCommand')) type = 'bot_command'
    else if (qual.includes('MessageEntityUrl')) type = 'url'
    else if (qual.includes('MessageEntityEmail')) type = 'email'
    else if (qual.includes('MessageEntityPhone')) type = 'phone_number'
    else if (qual.includes('MessageEntityBold')) type = 'bold'
    else if (qual.includes('MessageEntityItalic')) type = 'italic'
    else if (qual.includes('MessageEntityUnderline')) type = 'underline'
    else if (qual.includes('MessageEntityStrike')) type = 'strikethrough'
    else if (qual.includes('MessageEntitySpoiler')) type = 'spoiler'
    else if (qual.includes('MessageEntityBlockquote')) type = 'blockquote'
    else if (qual.includes('MessageEntityCode')) type = 'code'
    else if (qual.includes('MessageEntityPre')) {
      type = 'pre'
      language = rawEnt.language
    } else if (qual.includes('MessageEntityTextUrl')) {
      type = 'text_link'
      url = rawEnt.url
    } else if (qual.includes('MessageEntityCustomEmoji')) {
      type = 'custom_emoji'
      customEmojiId = rawEnt.document_id?.toString() ?? rawEnt.documentId?.toString()
    }

    return new MessageEntity({
      type,
      offset: rawEnt.offset ?? 0,
      length: rawEnt.length ?? 0,
      url,
      user,
      language,
      customEmojiId,
      raw: rawEnt,
    })
  }
}
