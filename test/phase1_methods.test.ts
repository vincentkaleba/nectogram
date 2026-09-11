import { describe, it, expect, vi } from 'vitest'
import { Client } from '../src/client/Client.js'

describe('Phase 1 Methods Test Suite', () => {
  it('should expose all Phase 1 media and management methods on Client.prototype', () => {
    const client = new Client({ apiId: 12345, apiHash: 'test_hash', inMemory: true })

    expect(typeof client.sendPhoto).toBe('function')
    expect(typeof client.sendVideo).toBe('function')
    expect(typeof client.sendDocument).toBe('function')
    expect(typeof client.sendAnimation).toBe('function')
    expect(typeof client.sendAudio).toBe('function')
    expect(typeof client.sendVoice).toBe('function')
    expect(typeof client.getChatHistory).toBe('function')
    expect(typeof client.getChatHistoryCount).toBe('function')
    expect(typeof client.sendReaction).toBe('function')
    expect(typeof client.setChatDescription).toBe('function')
    expect(typeof client.createChannel).toBe('function')
    expect(typeof client.createGroup).toBe('function')
    expect(typeof client.createSupergroup).toBe('function')
    expect(typeof client.answerInlineQuery).toBe('function')
    expect(typeof client.createInvoiceLink).toBe('function')
    expect(typeof client.sendInvoice).toBe('function')
    expect(typeof client.getCommonChats).toBe('function')
    expect(typeof client.getChatPhotos).toBe('function')
    expect(typeof client.saveFile).toBe('function')
    expect(typeof client.setChatAccentColor).toBe('function')
    expect(typeof client.setChatProfileAccentColor).toBe('function')
  })

  it('should support progress callback and progressArgs in saveFile', async () => {
    const client = new Client({ apiId: 12345, apiHash: 'test_hash', inMemory: true })

    const progressFn = vi.fn()
    client.invoke = vi.fn().mockResolvedValue({ photo: { id: 1n, access_hash: 2n, file_reference: Buffer.from([]) } })

    const fileBuffer = Buffer.from('hello world MTProto test file upload')
    const customArg = { customKey: 'customValue' }
    const inputFile = await client.saveFile(fileBuffer, { progress: progressFn, progressArgs: [customArg, 'extraParam'] })

    expect(inputFile).toBeDefined()
    expect(progressFn).toHaveBeenCalledWith(fileBuffer.length, fileBuffer.length, customArg, 'extraParam')
  })
})
