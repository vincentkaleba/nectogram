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

export async function applyGiftCode(
  this: Client,
  slug: string
): Promise<boolean> {
  const res = await this.invoke(new raw.functions.payments.ApplyGiftCode(slug))
  return Boolean(res)
}

export async function checkGiftCode(
  this: Client,
  slug: string
): Promise<any> {
  const res = await this.invoke(new raw.functions.payments.CheckGiftCode(slug))
  return res
}

export async function convertGiftToStars(
  this: Client,
  stargift: raw.base.InputSavedStarGift
): Promise<boolean> {
  const res = await this.invoke(new raw.functions.payments.ConvertStarGift(stargift))
  return Boolean(res)
}

export async function getPaymentForm(
  this: Client,
  invoice: raw.base.InputInvoice
): Promise<any> {
  const res = await this.invoke(new raw.functions.payments.GetPaymentForm(invoice))
  return res
}

export async function sendPaymentForm(
  this: Client,
  formId: bigint,
  invoice: raw.base.InputInvoice
): Promise<any> {
  const res = await this.invoke(new raw.functions.payments.SendStarsForm(formId, invoice))
  return res
}

export async function transferGift(
  this: Client,
  stargift: raw.base.InputSavedStarGift,
  toUser: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(toUser)
  const res = await this.invoke(new raw.functions.payments.TransferStarGift(stargift, peer))
  return Boolean(res)
}

