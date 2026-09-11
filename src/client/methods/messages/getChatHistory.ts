//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'
import { Message } from '../../../types/index.js'

export interface GetChatHistoryOptions {
  limit?: number
  offsetId?: number
  offsetDate?: number
  addOffset?: number
  maxId?: number
  minId?: number
}

export async function getChatHistory(
  this: Client,
  chatId: PeerLike,
  options?: GetChatHistoryOptions
): Promise<Message[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.messages.GetHistory(
      peer,
      options?.offsetId ?? 0,
      options?.offsetDate ?? 0,
      options?.addOffset ?? 0,
      options?.limit ?? 100,
      options?.maxId ?? 0,
      options?.minId ?? 0,
      0n
    )
  )

  if ('messages' in res) {
    return res.messages.map((m: any) => Message._parse(m))
  }
  return []
}

export async function getChatHistoryCount(
  this: Client,
  chatId: PeerLike
): Promise<number> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.messages.GetHistory(
      peer,
      0,
      0,
      0,
      1,
      0,
      0,
      0n
    )
  )

  if ('count' in res && typeof res.count === 'number') {
    return res.count
  }
  if ('messages' in res) {
    return res.messages.length
  }
  return 0
}
