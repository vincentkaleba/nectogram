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

import { describe, it, expect } from 'vitest'
import * as raw from '../src/raw/index.js'
import {
  User,
  Chat,
  Message,
  CallbackQuery,
  InlineKeyboardButton,
  InlineKeyboardMarkup
} from '../src/types/index.js'

describe('High-Level Types Module', () => {
  describe('User', () => {
    it('should parse raw TL User into high-level User instance', () => {
      const rawUser = new raw.types.User(
        123456789n,
        true, // isSelf
        false, // contact
        false, // mutual_contact
        false, // deleted
        false, // bot
        false, // bot_chat_history
        false, // bot_nochats
        false, // verified
        false, // restricted
        false, // min
        false, // bot_inline_geo
        false, // support
        false, // scam
        false, // apply_min_photo
        false, // fake
        false, // bot_attach_menu
        false, // premium
        false, // attach_menu_enabled
        false, // bot_can_edit
        false, // close_friend
        false, // stories_hidden
        false, // stories_unavailable
        false, // contact_require_premium
        false, // bot_business
        false, // bot_has_main_app
        false, // bot_forum_view
        false, // bot_forum_can_manage_topics
        false, // bot_can_manage_bots
        false, // bot_guestchat
        false, // bot_guard
        999n,  // access_hash
        'John', // first_name
        'Doe', // last_name
        'johndoe', // username
        '123456789' // phone
      )

      const user = User._parse(rawUser)
      expect(user.id).toBe(123456789n)
      expect(user.isSelf).toBe(true)
      expect(user.isBot).toBe(false)
      expect(user.firstName).toBe('John')
      expect(user.lastName).toBe('Doe')
      expect(user.fullName).toBe('John Doe')
      expect(user.username).toBe('johndoe')
      expect(user.mention).toBe('[John Doe](tg://user?id=123456789)')
    })
  })

  describe('Chat', () => {
    it('should parse raw TL Chat into high-level Chat instance', () => {
      const rawChat = new raw.types.Chat(
        987654n, // id
        'Test Group', // title
        new raw.types.ChatPhotoEmpty(), // photo
        10, // participants_count
        Math.floor(Date.now() / 1000), // date
        1 // version
      )

      const chat = Chat._parse(rawChat)
      expect(chat.id).toBe(987654n)
      expect(chat.type).toBe('group')
      expect(chat.title).toBe('Test Group')
      expect(chat.membersCount).toBe(10)
    })
  })

  describe('InlineKeyboards', () => {
    it('should serialize InlineKeyboardMarkup to Telegram TL ReplyInlineMarkup', () => {
      const markup = new InlineKeyboardMarkup([
        [
          new InlineKeyboardButton({ text: 'Google', url: 'https://google.com' }),
          new InlineKeyboardButton({ text: 'Click Me', callbackData: 'btn_click' }),
        ],
      ])

      const tl = markup.writeTL()
      expect(tl).toBeInstanceOf(raw.types.ReplyInlineMarkup)
      expect(tl.rows.length).toBe(1)
      expect(tl.rows[0].buttons.length).toBe(2)
      expect(tl.rows[0].buttons[0].type_).toBeInstanceOf(raw.types.InlineButtonTypeUrl)
      expect(tl.rows[0].buttons[1].type_).toBeInstanceOf(raw.types.InlineButtonTypeCallback)
    })
  })

  describe('CallbackQuery', () => {
    it('should parse raw UpdateBotCallbackQuery into CallbackQuery instance', () => {
      const rawUpdate = new raw.types.UpdateBotCallbackQuery(
        9999n, // query_id
        12345n, // user_id
        new raw.types.PeerUser(12345n), // peer
        100, // msg_id
        888n, // chat_instance
        Buffer.from('btn_click', 'utf8') // data
      )

      const cb = CallbackQuery._parse(rawUpdate)
      expect(cb.id).toBe('9999')
      expect(cb.fromUser.id).toBe(12345n)
      expect(cb.data).toBe('btn_click')
      expect(cb.chatInstance).toBe(888n)
    })
  })
})
