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

import { describe, it, expect, afterEach } from 'vitest'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { MemoryStorage, FileStorage } from '../src/storage/index.js'
import { AuthKey } from '../src/session/index.js'

describe('Storage & Session Persistence Module', () => {
  describe('MemoryStorage', () => {
    it('should set and get session properties', async () => {
      const storage = new MemoryStorage()
      const authKey = new AuthKey(Buffer.alloc(256, 0x55))

      await storage.setDcId(4)
      await storage.setApiId(123456)
      await storage.setTestMode(true)
      await storage.setAuthKey(authKey)
      await storage.setUserId(987654321n)
      await storage.setIsBot(true)

      expect(await storage.getDcId()).toBe(4)
      expect(await storage.getApiId()).toBe(123456)
      expect(await storage.getTestMode()).toBe(true)
      expect((await storage.getAuthKey())?.keyId).toBe(authKey.keyId)
      expect(await storage.getUserId()).toBe(987654321n)
      expect(await storage.getIsBot()).toBe(true)
    })

    it('should store and query peers by id, username, and phone', async () => {
      const storage = new MemoryStorage()
      await storage.updatePeer({
        id: 1001n,
        accessHash: 9999n,
        type: 'user',
        username: 'nectogram_user',
        phone: '+123456789',
      })

      const byId = await storage.getPeerById(1001n)
      expect(byId).not.toBeNull()
      expect(byId?.username).toBe('nectogram_user')

      const byUsername = await storage.getPeerByUsername('NECTOGRAM_USER')
      expect(byUsername?.id).toBe(1001n)

      const byPhone = await storage.getPeerByPhone('+123456789')
      expect(byPhone?.id).toBe(1001n)
    })

    it('should export and import Pyrogram-compatible session string', async () => {
      const storage1 = new MemoryStorage()
      const authKey = new AuthKey(Buffer.from(Array.from({ length: 256 }, (_, i) => (i * 3 + 7) & 0xff)))

      await storage1.setDcId(2)
      await storage1.setApiId(654321)
      await storage1.setTestMode(false)
      await storage1.setAuthKey(authKey)
      await storage1.setUserId(123456789n)
      await storage1.setIsBot(false)

      const sessionStr = await storage1.exportSessionString()
      expect(typeof sessionStr).toBe('string')
      expect(sessionStr.length).toBeGreaterThan(100)

      const storage2 = new MemoryStorage()
      await storage2.importSessionString(sessionStr)

      expect(await storage2.getDcId()).toBe(2)
      expect(await storage2.getApiId()).toBe(654321)
      expect(await storage2.getTestMode()).toBe(false)
      expect((await storage2.getAuthKey())?.keyId).toBe(authKey.keyId)
      expect(await storage2.getUserId()).toBe(123456789n)
    })
  })

  describe('FileStorage Persistence', () => {
    const testSessionPath = join(tmpdir(), `nectogram_test_${Date.now()}`)

    afterEach(async () => {
      const storage = new FileStorage(testSessionPath)
      await storage.delete()
    })

    it('should persist session to disk and restore upon opening', async () => {
      const storage1 = new FileStorage(testSessionPath)
      const authKey = new AuthKey(Buffer.alloc(256, 0xaa))

      await storage1.setDcId(3)
      await storage1.setApiId(777)
      await storage1.setAuthKey(authKey)
      await storage1.setUserId(5555n)
      await storage1.updatePeer({
        id: 42n,
        accessHash: 12345n,
        type: 'bot',
        username: 'nectogram_bot',
      })
      await storage1.close()

      // Re-open from disk in new instance
      const storage2 = new FileStorage(testSessionPath)
      await storage2.open()

      expect(await storage2.getDcId()).toBe(3)
      expect(await storage2.getApiId()).toBe(777)
      expect((await storage2.getAuthKey())?.keyId).toBe(authKey.keyId)
      expect(await storage2.getUserId()).toBe(5555n)

      const peer = await storage2.getPeerById(42n)
      expect(peer?.username).toBe('nectogram_bot')
    })
  })
})
