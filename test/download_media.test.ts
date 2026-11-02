import { describe, it, expect, vi } from 'vitest'
import { Client, Message, Video, Document, Photo, raw } from '../src/index.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('downloadMedia Resolution & Operations', () => {
  const client = new Client({
    apiId: 123456,
    apiHash: 'hash123',
    inMemory: true,
  })

  it('should extract location and download file from Video object', async () => {
    const rawDoc = new raw.types.Document(
      12345n,
      67890n,
      Buffer.from('ref'),
      1000,
      'video/mp4',
      1024n,
      1,
      [new raw.types.DocumentAttributeVideo(10, 1920, 1080)]
    )

    const video = Video._parse(rawDoc)

    vi.spyOn(client, 'invoke').mockImplementation(async (fn: any) => {
      if (fn instanceof raw.functions.upload.GetFile) {
        return new raw.types.upload.File(
          new raw.types.storage.FilePartial(),
          100,
          Buffer.from('fake_video_data')
        )
      }
      return {} as any
    })

    const result = await client.downloadMedia(video)
    expect(Buffer.isBuffer(result)).toBe(true)
    expect((result as Buffer).toString()).toBe('fake_video_data')
  })

  it('should extract location and download file from Message object containing video', async () => {
    const rawDoc = new raw.types.Document(
      99999n,
      88888n,
      Buffer.from('ref'),
      1000,
      'video/mp4',
      1024n,
      1,
      [new raw.types.DocumentAttributeVideo(10, 1280, 720)]
    )
    const mediaDoc = new raw.types.MessageMediaDocument(false, false, true, false, false, rawDoc)
    const rawMsg = new raw.types.Message(
      1,
      new raw.types.PeerUser(100n),
      1000,
      'test video',
      false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
      new raw.types.PeerUser(100n),
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      undefined, // reply_to
      mediaDoc
    )

    const msg = Message._parse(rawMsg, undefined, undefined, client)

    vi.spyOn(client, 'invoke').mockImplementation(async (fn: any) => {
      if (fn instanceof raw.functions.upload.GetFile) {
        return new raw.types.upload.File(
          new raw.types.storage.FilePartial(),
          100,
          Buffer.from('video_content')
        )
      }
      return {} as any
    })

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nectogram-test-'))
    const filePath = await client.downloadMedia(msg, {
      fileName: 'custom_video.mp4',
      outputDir: tmpDir,
    })

    expect(typeof filePath).toBe('string')
    expect(fs.existsSync(filePath as string)).toBe(true)
    expect(fs.readFileSync(filePath as string, 'utf8')).toBe('video_content')
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should fallback to getMessages when Message object has no attached media object', async () => {
    const emptyMsg = new Message({
      id: 42,
      chat: { id: 100n, type: 'private' } as any,
      date: new Date(),
      client,
    })

    const rawDoc = new raw.types.Document(
      777n,
      888n,
      Buffer.from('ref'),
      1000,
      'video/mp4',
      1024n,
      1,
      [new raw.types.DocumentAttributeVideo(5, 1280, 720)]
    )
    const mediaDoc = new raw.types.MessageMediaDocument(false, false, true, false, false, rawDoc)
    const fullRawMsg = new raw.types.Message(
      42,
      new raw.types.PeerUser(100n),
      1000,
      'fetched msg',
      false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
      new raw.types.PeerUser(100n),
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      undefined, // reply_to
      mediaDoc
    )

    vi.spyOn(client, 'getMessages').mockResolvedValue([fullRawMsg])

    vi.spyOn(client, 'invoke').mockImplementation(async (fn: any) => {
      if (fn instanceof raw.functions.upload.GetFile) {
        return new raw.types.upload.File(
          new raw.types.storage.FilePartial(),
          100,
          Buffer.from('fetched_file_data')
        )
      }
      return {} as any
    })

    const res = await client.downloadMedia(emptyMsg)
    expect(Buffer.isBuffer(res)).toBe(true)
    expect((res as Buffer).toString()).toBe('fetched_file_data')
  })

  it('should recursively follow reply chain to locate media on parent message', async () => {
    const promptMsg = new Message({
      id: 42,
      chat: { id: 100n, type: 'private' } as any,
      date: new Date(),
      client,
    })

    const textMsgRaw = new raw.types.Message(
      42,
      new raw.types.PeerUser(100n),
      1000,
      'text prompt',
      false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
      new raw.types.PeerUser(100n),
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      new raw.types.MessageReplyHeader(false, false, false, false, 41), // replies to msg 41
      undefined // no media on msg 42
    )

    const rawDoc = new raw.types.Document(
      555n,
      666n,
      Buffer.from('ref'),
      1000,
      'video/mp4',
      1024n,
      1,
      [new raw.types.DocumentAttributeVideo(5, 1280, 720)]
    )
    const mediaDoc = new raw.types.MessageMediaDocument(false, false, true, false, false, rawDoc)
    const parentMediaRaw = new raw.types.Message(
      41,
      new raw.types.PeerUser(100n),
      1000,
      'parent media msg',
      false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
      new raw.types.PeerUser(100n),
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      undefined,
      mediaDoc
    )

    vi.spyOn(client, 'getMessages').mockImplementation(async (chatId: any, ids: any) => {
      const idArr = Array.isArray(ids) ? ids : [ids]
      if (idArr.includes(42)) return [textMsgRaw]
      if (idArr.includes(41)) return [parentMediaRaw]
      return []
    })

    vi.spyOn(client, 'invoke').mockImplementation(async (fn: any) => {
      if (fn instanceof raw.functions.upload.GetFile) {
        return new raw.types.upload.File(
          new raw.types.storage.FilePartial(),
          100,
          Buffer.from('parent_file_data')
        )
      }
      return {} as any
    })

    const res = await client.downloadMedia(promptMsg)
    expect(Buffer.isBuffer(res)).toBe(true)
    expect((res as Buffer).toString()).toBe('parent_file_data')
  })
})
