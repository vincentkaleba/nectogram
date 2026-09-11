//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

export async function getChatMembers(
  this: Client,
  chatId: PeerLike,
  options?: {
    offset?: number
    limit?: number
  }
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  if (peer instanceof raw.types.InputPeerChannel) {
    const res = await this.invoke(
      new raw.functions.channels.GetParticipants(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash),
        new raw.types.ChannelParticipantsRecent(),
        options?.offset ?? 0,
        options?.limit ?? 200,
        0n
      )
    )
    return res
  }

  if (peer instanceof raw.types.InputPeerChat) {
    const res = await this.invoke(
      new raw.functions.messages.GetFullChat(peer.chat_id)
    )
    return res
  }

  throw new Error('getChatMembers: Unsupported peer type')
}

export async function getChatMember(
  this: Client,
  chatId: PeerLike,
  userId: PeerLike
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const userPeer = await this.peerResolver.resolvePeer(userId)

  if (peer instanceof raw.types.InputPeerChannel && userPeer) {
    const res = await this.invoke(
      new raw.functions.channels.GetParticipant(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash),
        userPeer
      )
    )
    return res
  }

  throw new Error('getChatMember: Supported for channels and supergroups')
}
