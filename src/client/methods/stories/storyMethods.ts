//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'
import { saveFile } from '../advanced/saveFile.js'

export async function sendStory(
  this: Client,
  chatId: PeerLike,
  media: string | Buffer,
  options?: { caption?: string; privacy?: any }
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const uploadedFile = await saveFile.call(this, media)

  const inputMedia = new raw.types.InputMediaUploadedPhoto(uploadedFile)
  const randomId = BigInt(Math.floor(Math.random() * 1e12))

  const res = await this.invoke(
    new raw.functions.stories.SendStory(
      peer,
      inputMedia,
      options?.privacy ?? [new raw.types.InputPrivacyValueAllowAll()],
      randomId,
      undefined,
      undefined,
      undefined,
      undefined,
      options?.caption
    )
  )

  return res
}

export async function getStories(
  this: Client,
  chatId: PeerLike,
  storyIds: number[]
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.stories.GetStoriesByID(
      peer,
      storyIds
    )
  )

  return res
}

export async function deleteStories(
  this: Client,
  chatId: PeerLike,
  storyIds: number[]
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  await this.invoke(
    new raw.functions.stories.DeleteStories(
      peer,
      storyIds
    )
  )

  return true
}
