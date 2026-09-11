//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

export async function sendReaction(
  this: Client,
  chatId: PeerLike,
  messageId: number,
  emoji?: string | null,
  options?: { isBig?: boolean; addToRecent?: boolean }
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const reactions: any[] = emoji
    ? [new raw.types.ReactionEmoji(emoji)]
    : []

  await this.invoke(
    new raw.functions.messages.SendReaction(
      peer,
      messageId,
      options?.isBig ? true : undefined,
      options?.addToRecent ? true : undefined,
      reactions.length > 0 ? reactions : undefined
    )
  )

  return true
}
