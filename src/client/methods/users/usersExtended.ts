//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'
import { Chat } from '../../../types/index.js'

export async function getCommonChats(
  this: Client,
  userId: PeerLike,
  limit: number = 100
): Promise<Chat[]> {
  const inputUser = await this.peerResolver.resolvePeer(userId)

  const res = await this.invoke(
    new raw.functions.messages.GetCommonChats(
      inputUser as any,
      0n,
      limit
    )
  )

  if ('chats' in res) {
    return res.chats.map((c: any) => Chat._parse(c))
  }
  return []
}

export async function getChatPhotos(
  this: Client,
  chatId: PeerLike,
  limit: number = 100
): Promise<any[]> {
  const inputPeer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.photos.GetUserPhotos(
      inputPeer as any,
      0,
      0n,
      limit
    )
  )

  if ('photos' in res) {
    return res.photos
  }
  return []
}

export async function getChatPhotosCount(
  this: Client,
  chatId: PeerLike
): Promise<number> {
  const inputPeer = await this.peerResolver.resolvePeer(chatId)

  if (inputPeer instanceof raw.types.InputPeerChannel) {
    const res = await this.invoke(
      new raw.functions.messages.GetSearchCounters(
        inputPeer,
        [new raw.types.InputMessagesFilterChatPhotos()]
      )
    )
    return res[0]?.count ?? 0
  } else {
    const res = await this.invoke(
      new raw.functions.photos.GetUserPhotos(
        inputPeer as any,
        0,
        0n,
        1
      )
    )
    if ('photos' in res) {
      return res.photos.length
    }
    return 0
  }
}

export async function getChatAudios(
  this: Client,
  chatId: PeerLike,
  limit: number = 100
): Promise<any[]> {
  const inputPeer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.users.GetSavedMusic(
      inputPeer as any,
      0,
      limit,
      0n
    )
  )

  if ('documents' in res) {
    return res.documents
  }
  return []
}

export async function getChatAudiosCount(
  this: Client,
  chatId: PeerLike
): Promise<number> {
  const inputPeer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.users.GetSavedMusic(
      inputPeer as any,
      0,
      1,
      0n
    )
  )

  return ('count' in res) ? res.count : 0
}

export async function checkUsername(
  this: Client,
  chatId: PeerLike,
  username: string
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  if (peer instanceof raw.types.InputPeerChannel) {
    const res = await this.invoke(
      new raw.functions.channels.CheckUsername(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash),
        username
      )
    )
    return Boolean(res)
  } else {
    const res = await this.invoke(
      new raw.functions.account.CheckUsername(username)
    )
    return Boolean(res)
  }
}

export async function deleteProfilePhotos(
  this: Client,
  photos: raw.base.InputPhoto[]
): Promise<boolean> {
  const res = await this.invoke(
    new raw.functions.photos.DeletePhotos(photos)
  )
  return Boolean(res)
}

export async function setProfilePhoto(
  this: Client,
  file?: raw.base.InputFile,
  isPublic?: boolean
): Promise<boolean> {
  const res = await this.invoke(
    new raw.functions.photos.UploadProfilePhoto(
      isPublic,
      undefined,
      file
    )
  )
  return Boolean(res)
}

export async function updateStatus(
  this: Client,
  offline: boolean = false
): Promise<boolean> {
  const res = await this.invoke(
    new raw.functions.account.UpdateStatus(offline)
  )
  return Boolean(res)
}

export async function updateBirthday(
  this: Client,
  day?: number,
  month?: number,
  year?: number
): Promise<boolean> {
  const birthday = (day && month) ? new raw.types.Birthday(day, month, year) : undefined
  const res = await this.invoke(
    new raw.functions.account.UpdateBirthday(birthday)
  )
  return Boolean(res)
}

export async function setEmojiStatus(
  this: Client,
  chatId?: PeerLike,
  emojiStatus?: raw.base.EmojiStatus
): Promise<boolean> {
  if (chatId) {
    const peer = await this.peerResolver.resolvePeer(chatId)
    if (peer instanceof raw.types.InputPeerChannel) {
      await this.invoke(
        new raw.functions.channels.UpdateEmojiStatus(
          new raw.types.InputChannel(peer.channel_id, peer.access_hash),
          emojiStatus ?? new raw.types.EmojiStatusEmpty()
        )
      )
      return true
    }
  }

  await this.invoke(
    new raw.functions.account.UpdateEmojiStatus(
      emojiStatus ?? new raw.types.EmojiStatusEmpty()
    )
  )
  return true
}

export async function setPersonalChannel(
  this: Client,
  chatId?: PeerLike
): Promise<boolean> {
  let peer: raw.base.InputChannel
  if (!chatId) {
    peer = new raw.types.InputChannelEmpty()
  } else {
    const resolved = await this.peerResolver.resolvePeer(chatId)
    if (resolved instanceof raw.types.InputPeerChannel) {
      peer = new raw.types.InputChannel(resolved.channel_id, resolved.access_hash)
    } else {
      return false
    }
  }

  const res = await this.invoke(
    new raw.functions.account.UpdatePersonalChannel(peer)
  )
  return Boolean(res)
}

export async function getDefaultEmojiStatuses(
  this: Client
): Promise<any> {
  const res = await this.invoke(
    new raw.functions.account.GetDefaultEmojiStatuses(0n)
  )
  return res
}

