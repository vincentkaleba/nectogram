//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'

export async function getBusinessConnection(
  this: Client,
  businessConnectionId: string
): Promise<any> {
  const res = await this.invoke(
    new raw.functions.account.GetBotBusinessConnection(
      businessConnectionId
    )
  )

  return res
}

export async function deleteBusinessMessages(
  this: Client,
  businessConnectionId: string,
  messageIds: number | number[]
): Promise<number> {
  const ids = Array.isArray(messageIds) ? messageIds : [messageIds]
  const res = (await this.invoke(
    new raw.functions.messages.DeleteMessages(ids, true)
  )) as any

  return res?.pts_count ?? 0
}

export async function getBusinessAccountStarBalance(
  this: Client,
  businessConnectionId: string
): Promise<bigint> {
  const conn = await getBusinessConnection.call(this, businessConnectionId)
  const user = (conn as any)?.users?.[0]
  if (!user) return 0n

  const res = (await this.invoke(
    new raw.functions.payments.GetStarsStatus(
      new raw.types.InputPeerUser(user.id, user.access_hash ?? 0n)
    )
  )) as any

  return res?.balance ?? 0n
}

export async function getBusinessAccountGifts(
  this: Client,
  businessConnectionId: string,
  options?: {
    limit?: number
    offset?: string
  }
): Promise<any[]> {
  const conn = await getBusinessConnection.call(this, businessConnectionId)
  const user = (conn as any)?.users?.[0]
  if (!user) return []

  const res = (await this.invoke(
    new raw.functions.payments.GetSavedStarGifts(
      new raw.types.InputPeerUser(user.id, user.access_hash ?? 0n),
      options?.offset ?? '',
      options?.limit ?? 100
    )
  )) as any

  return res?.gifts ?? []
}

export async function transferBusinessAccountStars(
  this: Client,
  businessConnectionId: string,
  starCount: bigint
): Promise<boolean> {
  const me = await this.getMe()
  const botUser = me.raw?.access_hash
    ? new raw.types.InputUser(me.id, me.raw.access_hash)
    : (new raw.types.InputUserSelf() as any)

  const invoice = new raw.types.InputInvoiceBusinessBotTransferStars(
    botUser,
    starCount
  )

  const form = (await this.invoke(
    new raw.functions.payments.GetPaymentForm(invoice)
  )) as any

  await this.invoke(
    new raw.functions.payments.SendStarsForm(
      form.form_id,
      invoice
    )
  )

  return true
}
