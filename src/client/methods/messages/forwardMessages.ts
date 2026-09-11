//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

export async function forwardMessages(
  this: Client,
  chatId: PeerLike,
  fromChatId: PeerLike,
  messageIds: number[]
): Promise<any> {
  const toPeer = await this.peerResolver.resolvePeer(chatId)
  const fromPeer = await this.peerResolver.resolvePeer(fromChatId)
  const randomIds = messageIds.map(() => BigInt(Math.floor(Math.random() * 1e12)))

  const res = await this.invoke(
    new raw.functions.messages.ForwardMessages(
      fromPeer,
      messageIds,
      randomIds,
      toPeer
    )
  )
  return res
}
