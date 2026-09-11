//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'

export async function answerCallbackQuery(
  this: Client,
  queryId: string | bigint,
  options?: {
    text?: string
    showAlert?: boolean
    url?: string
    cacheTime?: number
  }
): Promise<boolean> {
  const queryIdBigInt = typeof queryId === 'string' ? BigInt(queryId) : queryId

  const res = await this.invoke(
    new raw.functions.messages.SetBotCallbackAnswer(
      queryIdBigInt,
      options?.cacheTime ?? 0,
      options?.showAlert ?? false,
      options?.text,
      options?.url
    )
  )
  return Boolean(res)
}
