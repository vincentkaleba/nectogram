//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

export async function getCallMembers(
  this: Client,
  chatId: PeerLike,
  limit: number = 100
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  let fullChatRes: any
  if (peer instanceof raw.types.InputPeerChannel) {
    fullChatRes = await this.invoke(
      new raw.functions.channels.GetFullChannel(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash)
      )
    )
  } else if (peer instanceof raw.types.InputPeerChat) {
    fullChatRes = await this.invoke(
      new raw.functions.messages.GetFullChat(peer.chat_id)
    )
  } else {
    throw new Error('Target chat should be group, supergroup or channel.')
  }

  const fullChat = fullChatRes?.full_chat
  if (!fullChat?.call) {
    throw new Error('There is no active call in this chat.')
  }

  const res = (await this.invoke(
    new raw.functions.phone.GetGroupParticipants(
      fullChat.call,
      [],
      [],
      '',
      limit || 100
    )
  )) as any

  return res?.participants ?? []
}

