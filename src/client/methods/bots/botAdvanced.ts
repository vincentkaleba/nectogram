//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

/** Helper: Convert InputPeer → InputUser for bot functions */
function peerToInputUser(peer: raw.base.InputPeer): raw.base.InputUser {
  if (peer instanceof raw.types.InputPeerUser) {
    return new raw.types.InputUser(peer.user_id, peer.access_hash)
  }
  if (peer instanceof raw.types.InputPeerSelf) {
    return new raw.types.InputUserSelf()
  }
  return peer as any
}

/**
 * Answer a shipping query (for bots).
 * SetBotShippingResults(query_id: bigint, error?, shipping_options?)
 */
export async function answerShippingQuery(
  this: Client,
  shippingQueryId: string,
  ok: boolean,
  shippingOptions?: Array<{
    id: string
    title: string
    prices: Array<{ label: string; amount: number }>
  }>,
  errorMessage?: string
): Promise<boolean> {
  const res = await this.invoke(
    new raw.functions.messages.SetBotShippingResults(
      BigInt(shippingQueryId),
      errorMessage ?? undefined,
      shippingOptions?.map(
        (opt) =>
          new raw.types.ShippingOption(
            opt.id,
            opt.title,
            opt.prices.map((p) => new raw.types.LabeledPrice(p.label, BigInt(p.amount)))
          )
      )
    )
  )
  return Boolean(res)
}

/**
 * Answer a pre-checkout query (for bots).
 * SetBotPrecheckoutResults(query_id: bigint, success?, error?)
 */
export async function answerPreCheckoutQuery(
  this: Client,
  preCheckoutQueryId: string,
  ok: boolean,
  errorMessage?: string
): Promise<boolean> {
  const res = await this.invoke(
    new raw.functions.messages.SetBotPrecheckoutResults(
      BigInt(preCheckoutQueryId),
      ok ? true : undefined,
      errorMessage ?? undefined
    )
  )
  return Boolean(res)
}

/**
 * Get a bot's info.
 * GetBotInfo(lang_code: string, bot?: InputUser)
 */
export async function getBotInfoDescription(
  this: Client,
  botId?: PeerLike,
  langCode?: string
): Promise<string> {
  const botUser = botId ? peerToInputUser(await this.peerResolver.resolvePeer(botId)) : undefined
  const res = (await this.invoke(
    new raw.functions.bots.GetBotInfo(langCode ?? '', botUser)
  )) as any
  return res?.description ?? ''
}

/**
 * Set a bot's info description.
 * SetBotInfo(lang_code, bot?, name?, about?, description?)
 */
export async function setBotInfoDescription(
  this: Client,
  description: string,
  botId?: PeerLike,
  langCode?: string
): Promise<boolean> {
  const botUser = botId ? peerToInputUser(await this.peerResolver.resolvePeer(botId)) : undefined
  const res = await this.invoke(
    new raw.functions.bots.SetBotInfo(
      langCode ?? '',
      botUser,
      undefined,
      undefined,
      description
    )
  )
  return Boolean(res)
}

/**
 * Get a bot's short description (about).
 */
export async function getBotInfoShortDescription(
  this: Client,
  botId?: PeerLike,
  langCode?: string
): Promise<string> {
  const botUser = botId ? peerToInputUser(await this.peerResolver.resolvePeer(botId)) : undefined
  const res = (await this.invoke(
    new raw.functions.bots.GetBotInfo(langCode ?? '', botUser)
  )) as any
  return res?.about ?? ''
}

/**
 * Set a bot's short description (about).
 */
export async function setBotInfoShortDescription(
  this: Client,
  shortDescription: string,
  botId?: PeerLike,
  langCode?: string
): Promise<boolean> {
  const botUser = botId ? peerToInputUser(await this.peerResolver.resolvePeer(botId)) : undefined
  const res = await this.invoke(
    new raw.functions.bots.SetBotInfo(
      langCode ?? '',
      botUser,
      undefined,
      shortDescription,
      undefined
    )
  )
  return Boolean(res)
}

/**
 * Get the current bot name.
 */
export async function getBotName(
  this: Client,
  botId?: PeerLike,
  langCode?: string
): Promise<string> {
  const botUser = botId ? peerToInputUser(await this.peerResolver.resolvePeer(botId)) : undefined
  const res = (await this.invoke(
    new raw.functions.bots.GetBotInfo(langCode ?? '', botUser)
  )) as any
  return res?.name ?? ''
}

/**
 * Set the bot name.
 */
export async function setBotName(
  this: Client,
  name: string,
  botId?: PeerLike,
  langCode?: string
): Promise<boolean> {
  const botUser = botId ? peerToInputUser(await this.peerResolver.resolvePeer(botId)) : undefined
  const res = await this.invoke(
    new raw.functions.bots.SetBotInfo(
      langCode ?? '',
      botUser,
      name,
      undefined,
      undefined
    )
  )
  return Boolean(res)
}

/**
 * Get the current default permissions/privileges for the bot.
 */
export async function getBotDefaultPrivileges(
  this: Client,
  botId?: PeerLike,
  langCode?: string
): Promise<any> {
  const botUser = botId ? peerToInputUser(await this.peerResolver.resolvePeer(botId)) : undefined
  const res = (await this.invoke(
    new raw.functions.bots.GetBotInfo(langCode ?? '', botUser)
  )) as any
  return res
}

/**
 * Set the default privileges (admin rights) for the bot in channels.
 * SetBotBroadcastDefaultAdminRights(admin_rights)
 */
export async function setBotDefaultPrivileges(
  this: Client,
  rights: {
    canManageChat?: boolean
    canDeleteMessages?: boolean
    canManageVideoChats?: boolean
    canRestrictMembers?: boolean
    canPromoteMembers?: boolean
    canChangeInfo?: boolean
    canInviteUsers?: boolean
    canPinMessages?: boolean
    canManageTopics?: boolean
    isForChannels?: boolean
  }
): Promise<boolean> {
  const adminRights = new raw.types.ChatAdminRights(
    rights.canChangeInfo ?? false,
    false,
    false,
    rights.canDeleteMessages ?? false,
    rights.canRestrictMembers ?? false,
    rights.canInviteUsers ?? false,
    rights.canPinMessages ?? false,
    rights.canPromoteMembers ?? false,
    false,
    rights.canManageVideoChats ?? false,
    rights.canManageChat ?? false,
    rights.canManageTopics ?? false
  )
  const res = rights.isForChannels
    ? await this.invoke(new raw.functions.bots.SetBotBroadcastDefaultAdminRights(adminRights))
    : await this.invoke(new raw.functions.bots.SetBotGroupDefaultAdminRights(adminRights))
  return Boolean(res)
}

/**
 * Get the chat menu button for a specific user.
 * GetBotMenuButton(user_id: InputUser)
 */
export async function getChatMenuButton(
  this: Client,
  userId?: PeerLike
): Promise<any> {
  const user = userId
    ? peerToInputUser(await this.peerResolver.resolvePeer(userId))
    : new raw.types.InputUserEmpty()
  const res = (await this.invoke(new raw.functions.bots.GetBotMenuButton(user))) as any
  return res
}

/**
 * Set the chat menu button for a specific user.
 * SetBotMenuButton(user_id: InputUser, button: BotMenuButton)
 */
export async function setChatMenuButton(
  this: Client,
  userId?: PeerLike,
  options?: { text?: string; url?: string }
): Promise<boolean> {
  const user = userId
    ? peerToInputUser(await this.peerResolver.resolvePeer(userId))
    : new raw.types.InputUserEmpty()

  const button = options?.text && options?.url
    ? new raw.types.BotMenuButton(options.text, options.url)
    : new raw.types.BotMenuButtonDefault()

  const res = await this.invoke(new raw.functions.bots.SetBotMenuButton(user, button))
  return Boolean(res)
}

/**
 * Get game high scores for a message.
 * GetGameHighScores(peer, id, user_id: InputUser)
 */
export async function getGameHighScores(
  this: Client,
  chatId: PeerLike,
  messageId: number,
  userId?: PeerLike
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const user = userId
    ? peerToInputUser(await this.peerResolver.resolvePeer(userId))
    : new raw.types.InputUserEmpty()

  const res = (await this.invoke(
    new raw.functions.messages.GetGameHighScores(peer, messageId, user)
  )) as any
  return res?.scores ?? []
}

/**
 * Set a game score for a user.
 * SetGameScore(peer, id, user_id: InputUser, score, edit_message?, force?)
 */
export async function setGameScore(
  this: Client,
  chatId: PeerLike,
  messageId: number,
  userId: PeerLike,
  score: number,
  force?: boolean,
  noEdit?: boolean
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const user = peerToInputUser(await this.peerResolver.resolvePeer(userId))

  const res = await this.invoke(
    new raw.functions.messages.SetGameScore(
      peer,
      messageId,
      user,
      score,
      noEdit ? undefined : true, // edit_message
      force ?? false
    )
  )
  return res
}

/**
 * Request inline bot results.
 * GetInlineBotResults(bot: InputUser, peer, query, offset, geo_point?)
 */
export async function getInlineBotResults(
  this: Client,
  botId: PeerLike,
  chatId: PeerLike,
  query: string = '',
  offset: string = ''
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const bot = peerToInputUser(await this.peerResolver.resolvePeer(botId))

  const res = (await this.invoke(
    new raw.functions.messages.GetInlineBotResults(
      bot,
      peer,
      query,
      offset
    )
  )) as any
  return res?.results ?? []
}

/**
 * Send a result from an inline bot.
 * SendInlineBotResult(peer, random_id, query_id, id, silent?, background?, clear_draft?, hide_via?, reply_to?, schedule_date?, send_as?, quick_reply_shortcut?, allow_paid_stars?)
 */
export async function sendInlineBotResult(
  this: Client,
  chatId: PeerLike,
  queryId: bigint,
  resultId: string,
  options?: {
    silent?: boolean
    hideVia?: boolean
    replyToMessageId?: number
    scheduleDate?: number
    allowPaidBroadcast?: bigint
  }
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.messages.SendInlineBotResult(
      peer,
      BigInt(Math.floor(Math.random() * 2 ** 31)),
      queryId,
      resultId,
      options?.silent ?? false,
      undefined, // background
      undefined, // clear_draft
      options?.hideVia ?? false,
      options?.replyToMessageId
        ? new raw.types.InputReplyToMessage(options.replyToMessageId, undefined, undefined, undefined)
        : undefined,
      options?.scheduleDate ?? undefined
    )
  )
  return res
}

/**
 * Check if a bot username is available.
 * bots.CheckUsername(username)
 */
export async function checkBotUsername(
  this: Client,
  username: string
): Promise<boolean> {
  const res = (await this.invoke(
    new raw.functions.bots.CheckUsername(username)
  )) as any
  return res === true || res?._ === 'boolTrue'
}

/**
 * Get bots owned by the current user (admined bots).
 */
export async function getOwnedBots(this: Client): Promise<any[]> {
  const res = (await this.invoke(new raw.functions.bots.GetAdminedBots())) as any
  return res?.users ?? []
}

/**
 * Refund a Telegram Stars payment made to a bot.
 * RefundStarsCharge(user_id: InputUser, charge_id)
 */
export async function refundStarPayment(
  this: Client,
  userId: PeerLike,
  chargeId: string
): Promise<boolean> {
  const user = peerToInputUser(await this.peerResolver.resolvePeer(userId))
  const res = await this.invoke(
    new raw.functions.payments.RefundStarsCharge(user, chargeId)
  )
  return Boolean(res)
}

/**
 * Edit a user's star subscription (cancel or reactivate).
 * ChangeStarsSubscription(peer, subscription_id, canceled?)
 */
export async function editUserStarSubscription(
  this: Client,
  userId: PeerLike,
  subscriptionId: string,
  canceled: boolean
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(userId)
  const res = await this.invoke(
    new raw.functions.payments.ChangeStarsSubscription(peer, subscriptionId, canceled)
  )
  return Boolean(res)
}

/**
 * Send a game.
 * messages.SendMedia(peer, media: InputMediaGame, message: '', random_id)
 */
export async function sendGame(
  this: Client,
  chatId: PeerLike,
  gameShortName: string,
  options?: {
    disableNotification?: boolean
    replyToMessageId?: number
  }
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      new raw.types.InputMediaGame(
        new raw.types.InputGameShortName(
          new raw.types.InputUserSelf(),
          gameShortName
        )
      ),
      '',
      BigInt(Math.floor(Math.random() * 2 ** 31)),
      options?.disableNotification ?? undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      options?.replyToMessageId
        ? new raw.types.InputReplyToMessage(options.replyToMessageId, undefined, undefined, undefined)
        : undefined
    )
  )
  return res
}

/**
 * Create an invoice link for payments.
 * payments.ExportInvoice(invoice_media)
 */
export async function createInvoiceLink(
  this: Client,
  title: string,
  description: string,
  payload: string,
  currency: string,
  prices: Array<{ label: string; amount: number }>,
  options?: {
    providerToken?: string
    startParameter?: string
  }
): Promise<string> {
  const invoice = new raw.types.Invoice(
    currency,
    prices.map((p) => new raw.types.LabeledPrice(p.label, BigInt(p.amount)))
  )
  const invoiceMedia = new raw.types.InputMediaInvoice(
    title,
    description,
    invoice,
    Buffer.from(payload),
    new raw.types.DataJSON('{}'),
    undefined, // photo
    options?.providerToken ?? '',
    options?.startParameter
  )

  const res = (await this.invoke(
    new raw.functions.payments.ExportInvoice(invoiceMedia)
  )) as any

  return res?.url ?? ''
}

/**
 * Send an invoice to a chat.
 * messages.SendMedia(peer, media: InputMediaInvoice)
 */
export async function sendInvoice(
  this: Client,
  chatId: PeerLike,
  title: string,
  description: string,
  payload: string,
  currency: string,
  prices: Array<{ label: string; amount: number }>,
  options?: {
    providerToken?: string
    startParameter?: string
    disableNotification?: boolean
  }
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const invoice = new raw.types.Invoice(
    currency,
    prices.map((p) => new raw.types.LabeledPrice(p.label, BigInt(p.amount)))
  )
  const invoiceMedia = new raw.types.InputMediaInvoice(
    title,
    description,
    invoice,
    Buffer.from(payload),
    new raw.types.DataJSON('{}'),
    undefined, // photo
    options?.providerToken ?? '',
    options?.startParameter
  )

  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      invoiceMedia,
      '',
      BigInt(Math.floor(Math.random() * 2 ** 31)),
      options?.disableNotification ?? undefined
    )
  )

  return res
}
