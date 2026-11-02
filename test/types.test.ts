//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import { describe, it, expect, vi } from 'vitest'
import * as raw from '../src/raw/index.js'
import {
  User,
  Chat,
  Message,
  CallbackQuery,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  ForceReply,
  Document,
  Video,
  Audio,
  Photo,
  MessageEntity,
  Filters,
} from '../src/index.js'

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
        999n, // access_hash
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

  describe('Keyboards', () => {
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

    it('should serialize ReplyKeyboardMarkup to Telegram TL ReplyKeyboardMarkup', () => {
      const markup = new ReplyKeyboardMarkup({
        keyboard: [['Option 1', 'Option 2']],
        resizeKeyboard: true,
      })

      expect(markup.resize_keyboard).toBe(true)
      const tl = markup.toRaw()
      expect(tl).toBeInstanceOf(raw.types.ReplyKeyboardMarkup)
      expect(tl.resize).toBe(true)
      expect(tl.rows.length).toBe(1)
      expect(tl.rows[0].buttons.length).toBe(2)
    })

    it('should serialize ReplyKeyboardRemove to Telegram TL ReplyKeyboardHide', () => {
      const remove = new ReplyKeyboardRemove(true)
      expect(remove.remove_keyboard).toBe(true)
      const tl = remove.toRaw()
      expect(tl).toBeInstanceOf(raw.types.ReplyKeyboardHide)
      expect(tl.selective).toBe(true)
    })

    it('should serialize ForceReply to Telegram TL ReplyKeyboardForceReply', () => {
      const force = new ForceReply({ selective: true, inputFieldPlaceholder: 'Reply here...' })
      expect(force.force_reply).toBe(true)
      expect(force.input_field_placeholder).toBe('Reply here...')
      const tl = force.toRaw()
      expect(tl).toBeInstanceOf(raw.types.ReplyKeyboardForceReply)
      expect(tl.selective).toBe(true)
      expect(tl.placeholder).toBe('Reply here...')
    })
  })

  describe('Media & Message Types', () => {
    it('should expose media objects and snake_case getters', () => {
      const doc = new Document({
        fileId: 'doc123',
        fileName: 'report.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
      })

      expect(doc.file_id).toBe('doc123')
      expect(doc.file_name).toBe('report.pdf')
      expect(doc.file_size).toBe(2048)
      expect(doc.mime_type).toBe('application/pdf')

      const video = new Video({
        fileId: 'vid123',
        fileName: 'video.mp4',
        fileSize: 1048576,
        width: 1920,
        height: 1080,
        duration: 60,
      })
      expect(video.file_id).toBe('vid123')
      expect(video.file_size).toBe(1048576)
      expect(video.duration).toBe(60)

      const audio = new Audio({
        fileId: 'aud123',
        fileName: 'song.mp3',
        fileSize: 512000,
        performer: 'Artist',
        title: 'Track 1',
      })
      expect(audio.file_id).toBe('aud123')
      expect(audio.performer).toBe('Artist')

      const photo = new Photo({
        fileId: 'pic123',
        fileSize: 256000,
        width: 800,
        height: 600,
      })
      expect(photo.file_id).toBe('pic123')
      expect(photo.file_size).toBe(256000)
    })

    it('should handle Message bound methods: reply, edit, delete', async () => {
      const mockClient = {
        sendMessage: vi.fn().mockResolvedValue({ id: 101 }),
        editMessageText: vi.fn().mockResolvedValue({ id: 100 }),
        deleteMessages: vi.fn().mockResolvedValue(true),
        downloadMedia: vi.fn().mockResolvedValue(Buffer.from('test')),
      }

      const msg = new Message({
        id: 100,
        chat: new Chat({ id: 12345n, type: 'private' }),
        date: new Date(),
        text: 'Hello world',
        client: mockClient,
      })

      expect(msg.from_user).toBeUndefined()
      expect(msg.reply_to_message_id).toBeUndefined()

      await msg.reply('Replying back')
      expect(mockClient.sendMessage).toHaveBeenCalledWith(12345n, 'Replying back', { replyToMessageId: 100 })

      await msg.edit('Edited text')
      expect(mockClient.editMessageText).toHaveBeenCalledWith(12345n, 100, 'Edited text', undefined)

      await msg.delete()
      expect(mockClient.deleteMessages).toHaveBeenCalledWith(12345n, [100])

      await msg.download()
      expect(mockClient.downloadMedia).toHaveBeenCalledWith(msg, undefined)
    })

    it('should handle CallbackQuery bound methods: answer, editMessage, deleteMessage', async () => {
      const mockClient = {
        answerCallbackQuery: vi.fn().mockResolvedValue(true),
        editMessageText: vi.fn().mockResolvedValue({ id: 200 }),
        deleteMessages: vi.fn().mockResolvedValue(true),
      }

      const msg = new Message({
        id: 200,
        chat: new Chat({ id: 12345n, type: 'private' }),
        date: new Date(),
        text: 'Original message',
        client: mockClient,
      })

      const cb = new CallbackQuery({
        id: '9999',
        fromUser: new User({ id: 555n }),
        message: msg,
        data: 'btn_action',
        chatInstance: 777n,
        client: mockClient,
      })

      expect(cb.from_user.id).toBe(555n)
      expect(cb.chat_instance).toBe(777n)

      await cb.answer('Done!')
      expect(mockClient.answerCallbackQuery).toHaveBeenCalledWith('9999', { text: 'Done!' })

      await cb.editMessage('New content')
      expect(mockClient.editMessageText).toHaveBeenCalledWith(12345n, 200, 'New content', undefined)

      await cb.deleteMessage()
      expect(mockClient.deleteMessages).toHaveBeenCalledWith(12345n, [200])
    })
  })

  describe('New Filters', () => {
    it('should test Filters.media and Filters.callbackData', async () => {
      const msg = new Message({
        id: 1,
        chat: new Chat({ id: 100n, type: 'private' }),
        date: new Date(),
        document: new Document({ fileId: 'doc1' }),
      })

      const isMedia = await Filters.media({}, msg)
      expect(isMedia).toBe(true)

      const cb = new CallbackQuery({
        id: '1',
        fromUser: new User({ id: 2n }),
        data: 'confirm_btn',
      })

      const isCbData = await Filters.callbackData('confirm_btn')({}, cb)
      expect(isCbData).toBe(true)

      const isCbDataWrong = await Filters.callbackData('cancel_btn')({}, cb)
      expect(isCbDataWrong).toBe(false)
    })
  })
})
