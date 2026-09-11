//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

export async function setChatDescription(
  this: Client,
  chatId: PeerLike,
  description: string
): Promise<boolean> {
  const inputPeer = await this.peerResolver.resolvePeer(chatId)

  await this.invoke(
    new raw.functions.messages.EditChatAbout(
      inputPeer,
      description
    )
  )

  return true
}
