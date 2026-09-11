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
import { Client, PeerResolver } from '../src/client/index.js'
import { MemoryStorage } from '../src/storage/index.js'
import { User, Message } from '../src/types/index.js'
import { Filters } from '../src/filters.js'
import { AuthKey } from '../src/session/index.js'

describe('Client & API Methods Module (Step 8)', () => {
  describe('PeerResolver', () => {
    it('should resolve "me" to InputPeerSelf', async () => {
      const storage = new MemoryStorage()
      const resolver = new PeerResolver(storage)

      const peer = await resolver.resolvePeer('me')
      expect(peer).toBeInstanceOf(raw.types.InputPeerSelf)
    })

    it('should resolve positive integer to InputPeerUser and negative integer starting with -100 to InputPeerChannel', async () => {
      const storage = new MemoryStorage()
      const resolver = new PeerResolver(storage)

      const userPeer = await resolver.resolvePeer(123456n)
      expect(userPeer).toBeInstanceOf(raw.types.InputPeerUser)
      expect((userPeer as raw.types.InputPeerUser).user_id).toBe(123456n)

      const channelPeer = await resolver.resolvePeer(-1001987654321n)
      expect(channelPeer).toBeInstanceOf(raw.types.InputPeerChannel)
      expect((channelPeer as raw.types.InputPeerChannel).channel_id).toBe(1987654321n)

      const chatPeer = await resolver.resolvePeer(-999n)
      expect(chatPeer).toBeInstanceOf(raw.types.InputPeerChat)
      expect((chatPeer as raw.types.InputPeerChat).chat_id).toBe(999n)
    })

    it('should resolve username from storage peer cache', async () => {
      const storage = new MemoryStorage()
      await storage.updatePeer({
        id: 777n,
        accessHash: 888n,
        type: 'user',
        username: 'nectogram_bot',
      })

      const resolver = new PeerResolver(storage)
      const peer = await resolver.resolvePeer('@nectogram_bot')
      expect(peer).toBeInstanceOf(raw.types.InputPeerUser)
      expect((peer as raw.types.InputPeerUser).user_id).toBe(777n)
      expect((peer as raw.types.InputPeerUser).access_hash).toBe(888n)
    })
  })

  describe('Client Facade & Mock API Invocation', () => {
    it('should initialize Client with inMemory storage and properties', () => {
      const client = new Client({
        name: 'test_client',
        apiId: 123456,
        apiHash: 'hash123',
        inMemory: true,
      })

      expect(client.name).toBe('test_client')
      expect(client.apiId).toBe(123456)
      expect(client.apiHash).toBe('hash123')
      expect(client.storage).toBeInstanceOf(MemoryStorage)
    })

    it('should invoke getMe() and update client.me and storage', async () => {
      const client = new Client({
        apiId: 123456,
        apiHash: 'hash123',
        inMemory: true,
      })

      const rawUser = new raw.types.User(
        999n,
        true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
        111n,
        'Nectogram',
        'Bot',
        'nectogram_bot',
        undefined
      )

      client.session = {
        invoke: vi.fn().mockResolvedValue([rawUser]),
      } as any

      const me = await client.getMe()
      expect(me).toBeInstanceOf(User)
      expect(me.id).toBe(999n)
      expect(me.username).toBe('nectogram_bot')
      expect(client.me?.id).toBe(999n)
      expect(await client.storage.getUserId()).toBe(999n)
    })

    it('should invoke sendMessage() and return high-level Message', async () => {
      const client = new Client({
        apiId: 123456,
        apiHash: 'hash123',
        inMemory: true,
      })

      const sentMsg = new raw.types.UpdateShortSentMessage(
        1001, // id
        Math.floor(Date.now() / 1000), // date
        1, // pts
        1 // pts_count
      )

      client.session = {
        invoke: vi.fn().mockResolvedValue(sentMsg),
      } as any

      const msg = await client.sendMessage(555n, 'Hello from Nectogram client!')
      expect(msg).toBeInstanceOf(Message)
      expect(msg.id).toBe(1001)
      expect(msg.text).toBe('Hello from Nectogram client!')
    })

    it('should invoke editMessageText() and deleteMessages()', async () => {
      const client = new Client({
        apiId: 123456,
        apiHash: 'hash123',
        inMemory: true,
      })

      const rawEditedMsg = new raw.types.Message(
        1001,
        new raw.types.PeerUser(555n),
        1700000000,
        'Edited message text'
      )

      const editUpdate = {
        updates: [new raw.types.UpdateEditMessage(rawEditedMsg, 1, 1)],
      }

      client.session = {
        invoke: vi.fn()
          .mockResolvedValueOnce(editUpdate)
          .mockResolvedValueOnce({ pts_count: 1 }),
      } as any

      const editedMsg = await client.editMessageText(555n, 1001, 'Edited message text')
      expect(editedMsg).toBeInstanceOf(Message)
      expect(editedMsg.text).toBe('Edited message text')

      const deleteRes = await client.deleteMessages(555n, [1001])
      expect(deleteRes).toBe(true)
    })

    it('should export session string when auth key is present', async () => {
      const client = new Client({
        apiId: 123456,
        apiHash: 'hash123',
        inMemory: true,
      })

      const authKey = new AuthKey(Buffer.alloc(256, 0x77))
      await client.storage.setAuthKey(authKey)
      await client.storage.setDcId(2)
      await client.storage.setUserId(123456789n)

      const sessionStr = await client.exportSessionString()
      expect(typeof sessionStr).toBe('string')
      expect(sessionStr.length).toBeGreaterThan(100)
    })

    it('should register all 18 Pyrogram-style on* handler decorators', () => {
      const client = new Client({
        apiId: 123456,
        apiHash: 'hash123',
        inMemory: true,
        botToken: '123456:ABC',
        workers: 8,
        noUpdates: false,
      })

      expect(client.botToken).toBe('123456:ABC')
      expect(client.workers).toBe(8)

      const cb = vi.fn()
      client.onMessage(Filters.text, cb)
      client.onEditedMessage(cb)
      client.onCallbackQuery(cb)
      client.onInlineQuery(cb)
      client.onChosenInlineResult(cb)
      client.onChatMemberUpdated(cb)
      client.onChatJoinRequest(cb)
      client.onMessageReaction(cb)
      client.onPoll(cb)
      client.onStory(cb)
      client.onPreCheckoutQuery(cb)
      client.onShippingQuery(cb)
      client.onUserStatus(cb)
      client.onDeletedMessages(cb)
      client.onConnect(cb)
      client.onDisconnect(cb)
      client.onRawUpdate(cb)
      client.onError(cb)

      const handlersList = client.dispatcher.groups.get(0)
      expect(handlersList?.length).toBe(18)
    })
  })
})
