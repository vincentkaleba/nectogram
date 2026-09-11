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

export async function canPostStories(
  this: Client,
  chatId: PeerLike
): Promise<number> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.stories.CanSendStory(peer)
  )
  return res.count_remains ?? 0
}

export async function editStoryCaption(
  this: Client,
  chatId: PeerLike,
  storyId: number,
  caption: string
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.stories.EditStory(
      peer,
      storyId,
      undefined,
      undefined,
      caption
    )
  )
  return res
}

export async function editStoryMedia(
  this: Client,
  chatId: PeerLike,
  storyId: number,
  media: string | Buffer
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const uploadedFile = await saveFile.call(this, media)
  const inputMedia = new raw.types.InputMediaUploadedPhoto(uploadedFile)

  const res = await this.invoke(
    new raw.functions.stories.EditStory(
      peer,
      storyId,
      inputMedia
    )
  )
  return res
}

export async function editStoryPrivacy(
  this: Client,
  chatId: PeerLike,
  storyId: number,
  privacy: any[]
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.stories.EditStory(
      peer,
      storyId,
      undefined,
      undefined,
      undefined,
      undefined,
      privacy
    )
  )
  return res
}

export async function enableStealthMode(
  this: Client,
  options?: { past?: boolean; future?: boolean }
): Promise<any> {
  const res = await this.invoke(
    new raw.functions.stories.ActivateStealthMode(
      options?.past,
      options?.future
    )
  )
  return res
}

export async function getAllStories(
  this: Client,
  options?: { next?: boolean; hidden?: boolean; state?: string }
): Promise<any> {
  const res = await this.invoke(
    new raw.functions.stories.GetAllStories(
      options?.next,
      options?.hidden,
      options?.state
    )
  )
  return res
}

export async function getArchivedStories(
  this: Client,
  chatId: PeerLike,
  fromId: number = 0,
  limit: number = 100
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.stories.GetStoriesArchive(
      peer,
      fromId,
      limit
    )
  )
  return res
}

export async function getChatStories(
  this: Client,
  chatId: PeerLike
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.stories.GetPeerStories(peer)
  )
  return res
}

export async function getPinnedStories(
  this: Client,
  chatId: PeerLike,
  fromId: number = 0,
  limit: number = 100
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.stories.GetPinnedStories(
      peer,
      fromId,
      limit
    )
  )
  return res
}

export async function getStoryViews(
  this: Client,
  chatId: PeerLike,
  storyId: number,
  options?: {
    offset?: string
    limit?: number
    justContacts?: boolean
    reactionsFirst?: boolean
    forwardsFirst?: boolean
    q?: string
  }
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.stories.GetStoryViewsList(
      peer,
      storyId,
      options?.offset ?? '',
      options?.limit ?? 100,
      options?.justContacts,
      options?.reactionsFirst,
      options?.forwardsFirst,
      options?.q
    )
  )
  return res
}

export async function hideChatStories(
  this: Client,
  chatId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.stories.TogglePeerStoriesHidden(peer, true)
  )
  return Boolean(res)
}

export async function showChatStories(
  this: Client,
  chatId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.stories.TogglePeerStoriesHidden(peer, false)
  )
  return Boolean(res)
}

export async function pinChatStories(
  this: Client,
  chatId: PeerLike,
  storyIds: number | number[]
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const ids = Array.isArray(storyIds) ? storyIds : [storyIds]
  const res = await this.invoke(
    new raw.functions.stories.TogglePinned(peer, ids, true)
  )
  return res
}

export async function unpinChatStories(
  this: Client,
  chatId: PeerLike,
  storyIds: number | number[]
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const ids = Array.isArray(storyIds) ? storyIds : [storyIds]
  const res = await this.invoke(
    new raw.functions.stories.TogglePinned(peer, ids, false)
  )
  return res
}

export async function readChatStories(
  this: Client,
  chatId: PeerLike,
  maxId: number = 0
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.stories.ReadStories(peer, maxId || (1 << 31) - 1)
  )
  return res
}

export async function viewStories(
  this: Client,
  chatId: PeerLike,
  storyIds: number | number[]
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const ids = Array.isArray(storyIds) ? storyIds : [storyIds]
  const res = await this.invoke(
    new raw.functions.stories.IncrementStoryViews(peer, ids)
  )
  return Boolean(res)
}

export async function forwardStory(
  this: Client,
  chatId: PeerLike,
  fromChatId: PeerLike,
  storyId: number
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const fromPeer = await this.peerResolver.resolvePeer(fromChatId)
  const randomId = BigInt(Math.floor(Math.random() * 1e12))

  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      new raw.types.InputMediaStory(fromPeer, storyId),
      '',
      randomId
    )
  )
  return res
}

