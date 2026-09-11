//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

export async function getStarsBalance(
  this: Client
): Promise<bigint> {
  const res = await this.invoke(
    new raw.functions.payments.GetStarsStatus(
      new raw.types.InputPeerSelf()
    )
  )

  return res.balance
}

export async function getAvailableGifts(
  this: Client
): Promise<any> {
  const res = await this.invoke(
    new raw.functions.payments.GetStarGifts(
      0 // hash
    )
  )

  return res
}

export async function saveStarGift(
  this: Client,
  stargift: raw.base.InputSavedStarGift,
  unsave?: boolean
): Promise<boolean> {
  await this.invoke(
    new raw.functions.payments.SaveStarGift(
      stargift,
      unsave
    )
  )

  return true
}

export async function sendGift(
  this: Client,
  chatId: PeerLike,
  giftId: bigint,
  options?: {
    text?: string
    isPrivate?: boolean
    payForUpgrade?: boolean
  }
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const invoice = new raw.types.InputInvoiceStarGift(
    peer,
    giftId,
    options?.isPrivate ?? undefined,
    options?.payForUpgrade ?? undefined,
    options?.text ? new raw.types.TextWithEntities(options.text, []) : undefined
  )

  const form = (await this.invoke(
    new raw.functions.payments.GetPaymentForm(invoice)
  )) as any

  const res = await this.invoke(
    new raw.functions.payments.SendStarsForm(
      form.form_id,
      invoice
    )
  )

  return res
}
