//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'

export async function answerInlineQuery(
  this: Client,
  inlineQueryId: bigint | string,
  results: any[],
  options?: { cacheTime?: number; isPersonal?: boolean; nextOffset?: string }
): Promise<boolean> {
  const queryId = typeof inlineQueryId === 'string' ? BigInt(inlineQueryId) : inlineQueryId

  await this.invoke(
    new raw.functions.messages.SetInlineBotResults(
      queryId,
      results,
      options?.cacheTime ?? 300,
      undefined,
      options?.isPersonal ? true : undefined,
      options?.nextOffset
    )
  )

  return true
}
