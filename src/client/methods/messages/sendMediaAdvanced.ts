//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'
import { Message } from '../../../types/index.js'
import { parseText } from '../../../parser/index.js'
import { saveFile } from '../advanced/saveFile.js'

export interface BaseMediaOptions {
  caption?: string
  parseMode?: string | null
  hasSpoiler?: boolean
  ttlSeconds?: number
  viewOnce?: boolean
  disableNotification?: boolean
  replyToMessageId?: number
  showCaptionAboveMedia?: boolean
  thumb?: string | Buffer
}

export interface VideoMediaOptions extends BaseMediaOptions {
  duration?: number
  width?: number
  height?: number
  videoCover?: string | Buffer
  videoTimestamp?: number
  supportsStreaming?: boolean
  noSound?: boolean
  fileName?: string
}

export interface DocumentMediaOptions extends BaseMediaOptions {
  mimeType?: string
  fileName?: string
}

async function resolveVideoCover(
  client: Client,
  peer: raw.base.InputPeer,
  videoCover?: string | Buffer
): Promise<raw.types.InputPhoto | undefined> {
  if (!videoCover) return undefined

  let media: any
  if (typeof videoCover === 'string' && videoCover.match(/^https?:\/\//)) {
    media = new raw.types.InputMediaPhotoExternal(videoCover)
  } else {
    const uploadedFile = await saveFile.call(client, videoCover)
    media = new raw.types.InputMediaUploadedPhoto(uploadedFile)
  }

  const uploadedMedia = await client.invoke(
    new raw.functions.messages.UploadMedia(peer, media)
  )

  if (uploadedMedia && 'photo' in uploadedMedia && (uploadedMedia as any).photo) {
    const p = (uploadedMedia as any).photo
    return new raw.types.InputPhoto(p.id, p.access_hash, p.file_reference)
  }

  return undefined
}

export async function sendPhoto(
  this: Client,
  chatId: PeerLike,
  photo: string | Buffer,
  options?: BaseMediaOptions
): Promise<Message> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const randomId = BigInt(Math.floor(Math.random() * 1e12))
  const ttlSeconds = options?.viewOnce ? (1 << 31) - 1 : options?.ttlSeconds

  let inputMedia: any

  if (typeof photo === 'string' && photo.match(/^https?:\/\//)) {
    inputMedia = new raw.types.InputMediaPhotoExternal(
      photo,
      options?.hasSpoiler,
      ttlSeconds
    )
  } else {
    const uploadedFile = await saveFile.call(this, photo)
    inputMedia = new raw.types.InputMediaUploadedPhoto(
      uploadedFile,
      options?.hasSpoiler,
      undefined,
      undefined,
      ttlSeconds
    )
  }

  const { text, entities } = options?.caption ? parseText(options.caption) : { text: '', entities: [] }

  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      inputMedia,
      text,
      randomId,
      options?.disableNotification ? true : undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      options?.showCaptionAboveMedia ? true : undefined,
      undefined,
      options?.replyToMessageId ? new raw.types.InputReplyToMessage(options.replyToMessageId) : undefined,
      undefined,
      entities.length > 0 ? (entities as any) : undefined
    )
  )

  return Message._parse(res as any)
}

export async function sendVideo(
  this: Client,
  chatId: PeerLike,
  video: string | Buffer,
  options?: VideoMediaOptions
): Promise<Message> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const randomId = BigInt(Math.floor(Math.random() * 1e12))
  const ttlSeconds = options?.viewOnce ? (1 << 31) - 1 : options?.ttlSeconds

  const vcoverFile = await resolveVideoCover(this, peer, options?.videoCover)
  let inputMedia: any

  if (typeof video === 'string' && video.match(/^https?:\/\//)) {
    inputMedia = new raw.types.InputMediaDocumentExternal(
      video,
      options?.hasSpoiler,
      ttlSeconds,
      vcoverFile,
      options?.videoTimestamp
    )
  } else {
    const uploadedFile = await saveFile.call(this, video)
    const thumbFile = options?.thumb ? await saveFile.call(this, options.thumb) : undefined

    const attributes: any[] = [
      new raw.types.DocumentAttributeVideo(
        options?.duration ?? 0,
        options?.width ?? 0,
        options?.height ?? 0,
        false,
        options?.supportsStreaming ?? true,
        options?.noSound ?? false,
        undefined,
        options?.videoTimestamp
      )
    ]
    if (options?.fileName) {
      attributes.push(new raw.types.DocumentAttributeFilename(options.fileName))
    }

    inputMedia = new raw.types.InputMediaUploadedDocument(
      uploadedFile,
      'video/mp4',
      attributes,
      options?.noSound ?? undefined,
      undefined,
      options?.hasSpoiler,
      thumbFile,
      undefined,
      vcoverFile,
      options?.videoTimestamp,
      ttlSeconds
    )
  }

  const { text, entities } = options?.caption ? parseText(options.caption) : { text: '', entities: [] }

  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      inputMedia,
      text,
      randomId,
      options?.disableNotification ? true : undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      options?.showCaptionAboveMedia ? true : undefined,
      undefined,
      options?.replyToMessageId ? new raw.types.InputReplyToMessage(options.replyToMessageId) : undefined,
      undefined,
      entities.length > 0 ? (entities as any) : undefined
    )
  )

  return Message._parse(res as any)
}

export async function sendDocument(
  this: Client,
  chatId: PeerLike,
  document: string | Buffer,
  options?: DocumentMediaOptions
): Promise<Message> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const randomId = BigInt(Math.floor(Math.random() * 1e12))
  const ttlSeconds = options?.viewOnce ? (1 << 31) - 1 : options?.ttlSeconds

  let inputMedia: any

  if (typeof document === 'string' && document.match(/^https?:\/\//)) {
    inputMedia = new raw.types.InputMediaDocumentExternal(
      document,
      options?.hasSpoiler,
      ttlSeconds
    )
  } else {
    const uploadedFile = await saveFile.call(this, document)
    const thumbFile = options?.thumb ? await saveFile.call(this, options.thumb) : undefined

    const attributes: any[] = [
      new raw.types.DocumentAttributeFilename(options?.fileName ?? 'file.dat')
    ]
    inputMedia = new raw.types.InputMediaUploadedDocument(
      uploadedFile,
      options?.mimeType ?? 'application/octet-stream',
      attributes,
      undefined,
      undefined,
      options?.hasSpoiler,
      thumbFile,
      undefined,
      undefined,
      undefined,
      ttlSeconds
    )
  }

  const { text, entities } = options?.caption ? parseText(options.caption) : { text: '', entities: [] }

  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      inputMedia,
      text,
      randomId,
      options?.disableNotification ? true : undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      options?.showCaptionAboveMedia ? true : undefined,
      undefined,
      options?.replyToMessageId ? new raw.types.InputReplyToMessage(options.replyToMessageId) : undefined,
      undefined,
      entities.length > 0 ? (entities as any) : undefined
    )
  )

  return Message._parse(res as any)
}

export async function sendAnimation(
  this: Client,
  chatId: PeerLike,
  animation: string | Buffer,
  options?: BaseMediaOptions & { duration?: number; width?: number; height?: number }
): Promise<Message> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const randomId = BigInt(Math.floor(Math.random() * 1e12))
  const ttlSeconds = options?.viewOnce ? (1 << 31) - 1 : options?.ttlSeconds

  const uploadedFile = await saveFile.call(this, animation)
  const thumbFile = options?.thumb ? await saveFile.call(this, options.thumb) : undefined

  const attributes: any[] = [
    new raw.types.DocumentAttributeAnimated(),
    new raw.types.DocumentAttributeVideo(
      options?.duration ?? 0,
      options?.width ?? 0,
      options?.height ?? 0,
      false,
      false
    )
  ]

  const inputMedia = new raw.types.InputMediaUploadedDocument(
    uploadedFile,
    'video/mp4',
    attributes,
    undefined,
    undefined,
    options?.hasSpoiler,
    thumbFile,
    undefined,
    undefined,
    undefined,
    ttlSeconds
  )

  const { text, entities } = options?.caption ? parseText(options.caption) : { text: '', entities: [] }

  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      inputMedia,
      text,
      randomId,
      options?.disableNotification ? true : undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      options?.showCaptionAboveMedia ? true : undefined,
      undefined,
      options?.replyToMessageId ? new raw.types.InputReplyToMessage(options.replyToMessageId) : undefined,
      undefined,
      entities.length > 0 ? (entities as any) : undefined
    )
  )

  return Message._parse(res as any)
}

export async function sendAudio(
  this: Client,
  chatId: PeerLike,
  audio: string | Buffer,
  options?: BaseMediaOptions & { duration?: number; title?: string; performer?: string }
): Promise<Message> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const randomId = BigInt(Math.floor(Math.random() * 1e12))

  const uploadedFile = await saveFile.call(this, audio)
  const thumbFile = options?.thumb ? await saveFile.call(this, options.thumb) : undefined

  const attributes: any[] = [
    new raw.types.DocumentAttributeAudio(
      options?.duration ?? 0,
      false,
      options?.title,
      options?.performer
    )
  ]
  const inputMedia = new raw.types.InputMediaUploadedDocument(
    uploadedFile,
    'audio/mpeg',
    attributes,
    undefined,
    undefined,
    undefined,
    thumbFile
  )

  const { text, entities } = options?.caption ? parseText(options.caption) : { text: '', entities: [] }

  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      inputMedia,
      text,
      randomId,
      options?.disableNotification ? true : undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      options?.showCaptionAboveMedia ? true : undefined,
      undefined,
      options?.replyToMessageId ? new raw.types.InputReplyToMessage(options.replyToMessageId) : undefined,
      undefined,
      entities.length > 0 ? (entities as any) : undefined
    )
  )

  return Message._parse(res as any)
}

export async function sendVoice(
  this: Client,
  chatId: PeerLike,
  voice: string | Buffer,
  options?: BaseMediaOptions & { duration?: number }
): Promise<Message> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const randomId = BigInt(Math.floor(Math.random() * 1e12))

  const uploadedFile = await saveFile.call(this, voice)
  const attributes: any[] = [
    new raw.types.DocumentAttributeAudio(
      options?.duration ?? 0,
      true
    )
  ]
  const inputMedia = new raw.types.InputMediaUploadedDocument(
    uploadedFile,
    'audio/ogg',
    attributes
  )

  const { text, entities } = options?.caption ? parseText(options.caption) : { text: '', entities: [] }

  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      inputMedia,
      text,
      randomId,
      options?.disableNotification ? true : undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      options?.showCaptionAboveMedia ? true : undefined,
      undefined,
      options?.replyToMessageId ? new raw.types.InputReplyToMessage(options.replyToMessageId) : undefined,
      undefined,
      entities.length > 0 ? (entities as any) : undefined
    )
  )

  return Message._parse(res as any)
}
