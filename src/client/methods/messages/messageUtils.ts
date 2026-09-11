//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'
import { Message } from '../../../types/index.js'

export async function copyMessage(
  this: Client,
  chatId: PeerLike,
  fromChatId: PeerLike,
  messageId: number
): Promise<any> {
  // In MTProto, copyMessage forwards or re-sends the message content
  return await this.forwardMessages(chatId, fromChatId, [messageId])
}

export async function readHistory(
  this: Client,
  chatId: PeerLike,
  maxId: number = 0
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  if (peer instanceof raw.types.InputPeerChannel) {
    const res = await this.invoke(
      new raw.functions.channels.ReadHistory(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash),
        maxId
      )
    )
    return Boolean(res)
  }

  const res = await this.invoke(
    new raw.functions.messages.ReadHistory(peer, maxId)
  )
  return Boolean(res)
}

export async function pinChatMessage(
  this: Client,
  chatId: PeerLike,
  messageId: number,
  options?: {
    disableNotification?: boolean
  }
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.messages.UpdatePinnedMessage(
      peer,
      messageId,
      options?.disableNotification ?? false
    )
  )
  return Boolean(res)
}

export async function unpinChatMessage(
  this: Client,
  chatId: PeerLike,
  messageId: number
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.messages.UpdatePinnedMessage(
      peer,
      messageId,
      true, // unpin
      true // unpin
    )
  )
  return Boolean(res)
}

export async function unpinAllChatMessages(
  this: Client,
  chatId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.messages.UnpinAllMessages(peer)
  )
  return Boolean(res)
}
