//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

export async function applyBoost(
  this: Client,
  chatId: PeerLike,
  slots?: number[]
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.premium.ApplyBoost(
      peer,
      slots
    )
  )

  return res
}

export async function getBoostsStatus(
  this: Client,
  chatId: PeerLike
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.premium.GetBoostsStatus(
      peer
    )
  )

  return res
}
