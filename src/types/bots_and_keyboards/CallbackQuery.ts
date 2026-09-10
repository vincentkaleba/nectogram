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
import { Message } from '../messages_and_media/Message.js'

export interface CallbackQueryOptions {
  id: string
  fromUser: User
  message?: Message
  data?: string
  chatInstance?: bigint
  raw?: raw.types.UpdateBotCallbackQuery | raw.types.UpdateInlineBotCallbackQuery
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

  constructor(options: CallbackQueryOptions) {
    this.id = options.id.toString()
    this.fromUser = options.fromUser
    this.message = options.message
    this.data = options.data
    this.chatInstance = options.chatInstance
    this.raw = options.raw
  }

  /**
   * Parse a raw TL UpdateBotCallbackQuery object into a CallbackQuery.
   */
  public static _parse(
    rawUpdate: raw.types.UpdateBotCallbackQuery,
    usersMap?: Map<bigint, User>
  ): CallbackQuery {
    const fromUser = usersMap?.get(rawUpdate.user_id) ?? new User({ id: rawUpdate.user_id })
    const data = rawUpdate.data ? rawUpdate.data.toString('utf8') : undefined

    return new CallbackQuery({
      id: rawUpdate.query_id.toString(),
      fromUser,
      data,
      chatInstance: rawUpdate.chat_instance,
      raw: rawUpdate,
    })
  }
}
