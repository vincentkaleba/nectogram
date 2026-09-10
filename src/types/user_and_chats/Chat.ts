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

export type ChatType = 'private' | 'group' | 'supergroup' | 'channel'

export interface ChatOptions {
  id: bigint
  type: ChatType
  title?: string
  username?: string
  description?: string
  membersCount?: number
  raw?: raw.base.Chat
}

/**
 * High-level representation of a Telegram chat (private, group, supergroup, channel).
 */
export class Chat {
  public readonly id: bigint
  public readonly type: ChatType
  public readonly title?: string
  public readonly username?: string
  public readonly description?: string
  public readonly membersCount?: number
  public readonly raw?: raw.base.Chat

  constructor(options: ChatOptions) {
    this.id = options.id
    this.type = options.type
    this.title = options.title
    this.username = options.username
    this.description = options.description
    this.membersCount = options.membersCount
    this.raw = options.raw
  }

  /**
   * Parse a raw TL Chat or Channel object into a high-level Chat instance.
   */
  public static _parse(rawChat: raw.base.Chat): Chat {
    if (rawChat instanceof raw.types.Chat) {
      return new Chat({
        id: rawChat.id,
        type: 'group',
        title: rawChat.title,
        membersCount: rawChat.participants_count,
        raw: rawChat,
      })
    }

    if (rawChat instanceof raw.types.Channel) {
      const isSupergroup = rawChat.megagroup ?? false
      return new Chat({
        id: rawChat.id,
        type: isSupergroup ? 'supergroup' : 'channel',
        title: rawChat.title,
        username: rawChat.username ?? (rawChat.usernames && rawChat.usernames.length > 0 ? rawChat.usernames[0].username : undefined),
        membersCount: rawChat.participants_count,
        raw: rawChat,
      })
    }

    return new Chat({
      id: rawChat.id,
      type: 'group',
      title: 'title' in rawChat ? (rawChat as any).title : undefined,
      raw: rawChat,
    })
  }
}
