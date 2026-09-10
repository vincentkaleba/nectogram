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
import type { Client } from '../../Client.js'
import type { PeerLike } from '../../PeerResolver.js'

export interface EditMessageOptions {
  replyMarkup?: InlineKeyboardMarkup
}

export async function editMessageText(
  this: Client,
  chatId: PeerLike,
  messageId: number,
  text: string,
  options?: EditMessageOptions,
): Promise<Message> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  let replyMarkup: raw.base.ReplyMarkup | undefined
  if (options?.replyMarkup) {
    replyMarkup = options.replyMarkup.writeTL()
  }

  const res = await this.invoke(
    new raw.functions.messages.EditMessage(
      peer,
      messageId,
      undefined,
      undefined,
      text,
      undefined,
      replyMarkup
    )
  )

  let rawMessage: raw.types.Message | undefined

  if (res && typeof res === 'object' && 'updates' in res && Array.isArray((res as any).updates)) {
    for (const u of (res as any).updates) {
      if (u instanceof raw.types.UpdateEditMessage || u instanceof raw.types.UpdateEditChannelMessage) {
        if (u.message instanceof raw.types.Message) {
          rawMessage = u.message
          break
        }
      }
    }
  }

  if (rawMessage) {
    return Message._parse(rawMessage)
  }

  throw new Error('editMessageText: Failed to parse edited message update from server response')
}
