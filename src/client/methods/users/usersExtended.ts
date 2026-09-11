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
