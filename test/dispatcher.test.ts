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

import { describe, it, expect, vi } from 'vitest'
import * as raw from '../src/raw/index.js'
import {
  Dispatcher,
  MessageHandler,
  CallbackQueryHandler,
  RawUpdateHandler,
  ErrorHandler,
  StopPropagation,
  ContinuePropagation,
} from '../src/dispatcher/index.js'
import { Filters, createFilter } from '../src/filters.js'
import { Message, CallbackQuery, User, Chat } from '../src/types/index.js'

describe('Dispatcher & Filters Module (Step 7)', () => {
  describe('Filters Composition & Directives', () => {
    it('should evaluate text, private, photo, and bot filters correctly', async () => {
      const mockMsg = new Message({
        id: 1,
        chat: new Chat({ id: 100n, type: 'private' }),
        date: new Date(),
        text: 'Hello world',
        fromUser: new User({ id: 10n, isBot: false }),
      })

      expect(await Filters.text(null, mockMsg)).toBe(true)
      expect(await Filters.private(null, mockMsg)).toBe(true)
      expect(await Filters.group(null, mockMsg)).toBe(false)
      expect(await Filters.photo(null, mockMsg)).toBe(false)
      expect(await Filters.bot(null, mockMsg)).toBe(false)
    })

    it('should match commands and parse arguments into message.command', async () => {
      const commandFilter = Filters.command(['start', 'help'], '/', false)
      const mockClient = { me: { username: 'testbot' } }

      const msg1 = new Message({
        id: 1,
        chat: new Chat({ id: 100n, type: 'private' }),
        date: new Date(),
        text: '/start@testbot arg1 "arg 2"',
      })

      const res1 = await commandFilter(mockClient, msg1)
      expect(res1).toBe(true)
      expect((msg1 as any).command).toEqual(['start', 'arg1', 'arg 2'])

      const msg2 = new Message({
        id: 2,
        chat: new Chat({ id: 100n, type: 'private' }),
        date: new Date(),
        text: '/unknowncommand',
      })

      const res2 = await commandFilter(mockClient, msg2)
      expect(res2).toBe(false)
    })

    it('should match regex patterns and store matches in update.matches', async () => {
      const regexFilter = Filters.regex(/user_(\d+)/i)
      const query = new CallbackQuery({
        id: '123',
        fromUser: new User({ id: 10n }),
        data: 'click_user_99',
      })

      const res = await regexFilter(null, query)
      expect(res).toBe(true)
      expect(query.matches).not.toBeUndefined()
      expect(query.matches![0][1]).toBe('99')
    })

    it('should combine filters with and, or, invert operators', async () => {
      const f1 = createFilter((_, msg) => msg.text === 'A')
      const f2 = createFilter((_, msg) => msg.id === 1)

      const combinedAnd = f1.and(f2)
      const combinedOr = f1.or(f2)
      const inverted = f1.invert()

      const msgMatch = { text: 'A', id: 1 }
      const msgPartial = { text: 'A', id: 2 }

      expect(await combinedAnd(null, msgMatch)).toBe(true)
      expect(await combinedAnd(null, msgPartial)).toBe(false)

      expect(await combinedOr(null, msgPartial)).toBe(true)
      expect(await inverted(null, msgMatch)).toBe(false)
    })
  })

  describe('Dispatcher Event Routing & Handlers', () => {
    it('should route raw UpdateNewMessage to MessageHandler with parsed Message', async () => {
      const client = { me: { id: 1n, username: 'testbot' } }
      const dispatcher = new Dispatcher(client)

      const handlerFn = vi.fn()
      dispatcher.addHandler(new MessageHandler(handlerFn, Filters.text))

      const rawMsg = new raw.types.Message(
        101,
        new raw.types.PeerUser(1n),
        1700000000,
        'Test message from raw update',
        false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
        new raw.types.PeerUser(555n)
      )

      const update = new raw.types.UpdateNewMessage(rawMsg, 1, 1)

      const usersMap = new Map([[555n, new User({ id: 555n, username: 'alice' })]])
      const chatsMap = new Map()

      await dispatcher.handleUpdate(update, usersMap, chatsMap)

      expect(handlerFn).toHaveBeenCalledTimes(1)
      const [receivedClient, message] = handlerFn.mock.calls[0]
      expect(receivedClient).toBe(client)
      expect(message).toBeInstanceOf(Message)
      expect(message.text).toBe('Test message from raw update')
      expect(message.fromUser?.username).toBe('alice')
    })

    it('should respect priority groups and StopPropagation', async () => {
      const dispatcher = new Dispatcher({})
      const order: string[] = []

      // Group 0 handler 1: throws ContinuePropagation to allow next handler in group 0
      dispatcher.addHandler(
        new MessageHandler(async () => {
          order.push('g0_h1')
          throw new ContinuePropagation()
        }),
        0
      )

      // Group 0 handler 2: throws StopPropagation
      dispatcher.addHandler(
        new MessageHandler(async () => {
          order.push('g0_h2')
          throw new StopPropagation()
        }),
        0
      )

      // Group 1 handler (should NOT run because group 0 threw StopPropagation)
      dispatcher.addHandler(
        new MessageHandler(async () => {
          order.push('g1_h1')
        }),
        1
      )

      const rawMsg = new raw.types.Message(
        202,
        new raw.types.PeerUser(2n),
        1700000000,
        'Group test'
      )

      const update = new raw.types.UpdateNewMessage(rawMsg, 1, 1)
      await dispatcher.handleUpdate(update, new Map(), new Map())

      expect(order).toEqual(['g0_h1', 'g0_h2'])
    })

    it('should catch handler exceptions in ErrorHandler', async () => {
      const dispatcher = new Dispatcher({})
      const errorHandlerFn = vi.fn()

      dispatcher.addHandler(
        new MessageHandler(async () => {
          throw new TypeError('Simulated error')
        })
      )

      dispatcher.addHandler(new ErrorHandler(errorHandlerFn, TypeError))

      const rawMsg = new raw.types.Message(
        303,
        new raw.types.PeerUser(2n),
        1700000000,
        'Error test'
      )

      const update = new raw.types.UpdateNewMessage(rawMsg, 1, 1)
      await dispatcher.handleUpdate(update, new Map(), new Map())

      expect(errorHandlerFn).toHaveBeenCalledTimes(1)
      const [, err, targetHandler] = errorHandlerFn.mock.calls[0]
      expect(err).toBeInstanceOf(TypeError)
      expect(err.message).toBe('Simulated error')
      expect(targetHandler).toBeInstanceOf(MessageHandler)
    })
  })
})
