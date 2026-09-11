import { describe, it, expect, vi } from 'vitest'
import { Client } from '../src/index.js'

describe('Expanded API Methods Module', () => {
  it('should bind and expose all expanded API methods on Client instance', () => {
    const client = new Client({
      apiId: 123456,
      apiHash: 'hash123',
      inMemory: true,
    })

    expect(client.sendLocation).toBeDefined()
    expect(client.sendContact).toBeDefined()
    expect(client.sendDice).toBeDefined()
    expect(client.sendPoll).toBeDefined()
    expect(client.copyMessage).toBeDefined()
    expect(client.readHistory).toBeDefined()
    expect(client.pinChatMessage).toBeDefined()
    expect(client.unpinChatMessage).toBeDefined()
    expect(client.unpinAllChatMessages).toBeDefined()
    expect(client.getChatMember).toBeDefined()
    expect(client.banChatMember).toBeDefined()
    expect(client.unbanChatMember).toBeDefined()
    expect(client.setChatTitle).toBeDefined()
    expect(client.joinChat).toBeDefined()
    expect(client.leaveChat).toBeDefined()
    expect(client.setBotCommands).toBeDefined()
    expect(client.getBotCommands).toBeDefined()
    expect(client.deleteBotCommands).toBeDefined()
    expect(client.getUsers).toBeDefined()
    expect(client.blockUser).toBeDefined()
    expect(client.unblockUser).toBeDefined()
  })
})
