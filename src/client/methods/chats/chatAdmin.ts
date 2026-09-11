//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

export async function banChatMember(
  this: Client,
  chatId: PeerLike,
  userId: PeerLike,
  untilDate: number = 0
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const userPeer = await this.peerResolver.resolvePeer(userId)

  if (peer instanceof raw.types.InputPeerChannel) {
    const res = await this.invoke(
      new raw.functions.channels.EditBanned(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash),
        userPeer,
        new raw.types.ChatBannedRights(untilDate, true, true, true, true, true, true, true, true, true)
      )
    )
    return Boolean(res)
  }

  throw new Error('banChatMember: Supported for channels and supergroups')
}

export async function unbanChatMember(
  this: Client,
  chatId: PeerLike,
  userId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const userPeer = await this.peerResolver.resolvePeer(userId)

  if (peer instanceof raw.types.InputPeerChannel) {
    const res = await this.invoke(
      new raw.functions.channels.EditBanned(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash),
        userPeer,
        new raw.types.ChatBannedRights(0, false, false, false, false, false, false, false, false, false)
      )
    )
    return Boolean(res)
  }

  throw new Error('unbanChatMember: Supported for channels and supergroups')
}

export async function setChatTitle(
  this: Client,
  chatId: PeerLike,
  title: string
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  if (peer instanceof raw.types.InputPeerChannel) {
    const res = await this.invoke(
      new raw.functions.channels.EditTitle(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash),
        title
      )
    )
    return Boolean(res)
  }

  if (peer instanceof raw.types.InputPeerChat) {
    const res = await this.invoke(
      new raw.functions.messages.EditChatTitle(peer.chat_id, title)
    )
    return Boolean(res)
  }

  throw new Error('setChatTitle: Unsupported peer type')
}

export async function joinChat(
  this: Client,
  chatId: PeerLike
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  if (peer instanceof raw.types.InputPeerChannel) {
    const res = await this.invoke(
      new raw.functions.channels.JoinChannel(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash)
      )
    )
    return res
  }

  throw new Error('joinChat: Supported for channels and supergroups')
}

export async function leaveChat(
  this: Client,
  chatId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  if (peer instanceof raw.types.InputPeerChannel) {
    const res = await this.invoke(
      new raw.functions.channels.LeaveChannel(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash)
      )
    )
    return Boolean(res)
  }

  throw new Error('leaveChat: Supported for channels and supergroups')
}
