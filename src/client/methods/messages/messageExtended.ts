//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

/**
 * Get messages from a chat by IDs (up to 200 at a time).
 */
export async function getMessages(
  this: Client,
  chatId: PeerLike,
  messageIds: number | number[]
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const ids = Array.isArray(messageIds) ? messageIds : [messageIds]
  const inputIds = ids.map((id) => new raw.types.InputMessageID(id))

  let res: any
  if (peer instanceof raw.types.InputPeerChannel) {
    res = await this.invoke(
      new raw.functions.channels.GetMessages(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash),
        inputIds
      )
    )
  } else {
    res = await this.invoke(new raw.functions.messages.GetMessages(inputIds))
  }

  return res?.messages ?? []
}

/**
 * Search for messages in a chat.
 * Signature: Search(peer, q, filter, min_date, max_date, offset_id, add_offset, limit, max_id, min_id, hash, from_id?, ...)
 */
export async function searchMessages(
  this: Client,
  chatId: PeerLike,
  query: string = '',
  options?: {
    filter?: raw.base.MessagesFilter
    limit?: number
    offsetId?: number
    addOffset?: number
    minId?: number
    maxId?: number
    fromUser?: PeerLike
    topMsgId?: number
  }
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const fromPeer = options?.fromUser
    ? await this.peerResolver.resolvePeer(options.fromUser)
    : undefined

  const res = (await this.invoke(
    new raw.functions.messages.Search(
      peer,
      query,
      options?.filter ?? new raw.types.InputMessagesFilterEmpty(),
      0, // min_date
      0, // max_date
      options?.offsetId ?? 0,
      options?.addOffset ?? 0,
      options?.limit ?? 100,
      options?.maxId ?? 0,
      options?.minId ?? 0,
      0n, // hash (bigint)
      fromPeer,
      undefined, // saved_peer_id
      undefined, // saved_reaction
      options?.topMsgId ?? undefined
    )
  )) as any
  return res?.messages ?? []
}

/**
 * Search messages globally across all chats.
 */
export async function searchGlobal(
  this: Client,
  query: string,
  options?: {
    filter?: raw.base.MessagesFilter
    limit?: number
    offsetRate?: number
    offsetId?: number
    offsetPeer?: PeerLike
  }
): Promise<any[]> {
  const offsetPeer = options?.offsetPeer
    ? await this.peerResolver.resolvePeer(options.offsetPeer)
    : new raw.types.InputPeerEmpty()

  const res = (await this.invoke(
    new raw.functions.messages.SearchGlobal(
      query,
      options?.filter ?? new raw.types.InputMessagesFilterEmpty(),
      0,
      0,
      options?.offsetRate ?? 0,
      offsetPeer,
      options?.offsetId ?? 0,
      options?.limit ?? 100
    )
  )) as any
  return res?.messages ?? []
}

/**
 * Read all messages up to a specific message ID in a chat (mark as read).
 */
export async function readChatHistory(
  this: Client,
  chatId: PeerLike,
  maxId: number = 0
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  if (peer instanceof raw.types.InputPeerChannel) {
    await this.invoke(
      new raw.functions.channels.ReadHistory(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash),
        maxId
      )
    )
  } else {
    await this.invoke(new raw.functions.messages.ReadHistory(peer, maxId))
  }
  return true
}

/**
 * Read all mentions in a chat.
 */
export async function readMentions(
  this: Client,
  chatId: PeerLike,
  topMsgId?: number
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  await this.invoke(
    new raw.functions.messages.ReadMentions(peer, topMsgId ?? undefined)
  )
  return true
}

/**
 * Read all reactions in a chat.
 */
export async function readReactions(
  this: Client,
  chatId: PeerLike,
  topMsgId?: number
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  await this.invoke(
    new raw.functions.messages.ReadReactions(peer, topMsgId ?? undefined)
  )
  return true
}

/**
 * Delete the message history of a chat.
 */
export async function deleteChatHistory(
  this: Client,
  chatId: PeerLike,
  options?: {
    maxId?: number
    justClear?: boolean
    revoke?: boolean
  }
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  if (peer instanceof raw.types.InputPeerChannel) {
    await this.invoke(
      new raw.functions.channels.DeleteHistory(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash),
        options?.maxId ?? 0,
        options?.revoke ?? false
      )
    )
  } else {
    await this.invoke(
      new raw.functions.messages.DeleteHistory(
        peer,
        options?.maxId ?? 0,
        options?.justClear ?? false,
        options?.revoke ?? false
      )
    )
  }
  return true
}

/**
 * Get the number of messages matching a search query in a chat.
 */
export async function searchMessagesCount(
  this: Client,
  chatId: PeerLike,
  query: string = '',
  options?: {
    filter?: raw.base.MessagesFilter
    fromUser?: PeerLike
  }
): Promise<number> {
  const msgs = await searchMessages.call(this, chatId, query, {
    ...options,
    limit: 1,
  })
  return msgs.length
}

/**
 * Send a screenshot notification to a user in a private chat.
 */
export async function sendScreenshotNotification(
  this: Client,
  chatId: PeerLike,
  messageId: number
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  await this.invoke(
    new raw.functions.messages.SendScreenshotNotification(
      peer,
      new raw.types.InputReplyToMessage(messageId, undefined, undefined, undefined),
      BigInt(Math.floor(Math.random() * 2 ** 31))
    )
  )
  return true
}

/**
 * Vote in a poll.
 * options: Buffer[] - each buffer is a poll option data bytes
 */
export async function votePoll(
  this: Client,
  chatId: PeerLike,
  messageId: number,
  optionIndexes: number[]
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const options: Buffer[] = optionIndexes.map((i) => {
    const buf = Buffer.alloc(1)
    buf[0] = i
    return buf
  })
  await this.invoke(
    new raw.functions.messages.SendVote(peer, messageId, options)
  )
  return true
}

/**
 * Retract a vote in a poll (clear selection).
 */
export async function retractVote(
  this: Client,
  chatId: PeerLike,
  messageId: number
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  await this.invoke(new raw.functions.messages.SendVote(peer, messageId, []))
  return true
}

/**
 * Get all available message effects.
 */
export async function getAvailableEffects(this: Client): Promise<any[]> {
  const res = (await this.invoke(
    new raw.functions.messages.GetAvailableEffects(0)
  )) as any
  return res?.effects ?? []
}

/**
 * Get all stickers in a set by short name.
 */
export async function getStickers(
  this: Client,
  shortName: string
): Promise<any[]> {
  const res = (await this.invoke(
    new raw.functions.messages.GetStickerSet(
      new raw.types.InputStickerSetShortName(shortName),
      0
    )
  )) as any
  return res?.documents ?? []
}

/**
 * Get custom emoji stickers by their IDs.
 */
export async function getCustomEmojiStickers(
  this: Client,
  documentIds: bigint[]
): Promise<any[]> {
  const res = (await this.invoke(
    new raw.functions.messages.GetCustomEmojiDocuments(documentIds)
  )) as any
  return Array.isArray(res) ? res : []
}

/**
 * View messages (mark as viewed for view count).
 */
export async function viewMessages(
  this: Client,
  chatId: PeerLike,
  messageIds: number[],
  increment?: boolean
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  await this.invoke(
    new raw.functions.messages.GetMessagesViews(
      peer,
      messageIds,
      increment ?? true
    )
  )
  return true
}

/**
 * Get scheduled messages in a chat.
 */
export async function getScheduledMessages(
  this: Client,
  chatId: PeerLike,
  messageIds?: number[]
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = (await this.invoke(
    new raw.functions.messages.GetScheduledMessages(peer, messageIds ?? [])
  )) as any
  return res?.messages ?? []
}

/**
 * Send a paid reaction to a message (Telegram Stars).
 * Signature: SendPaidReaction(peer, msg_id, count, random_id, private_?)
 */
export async function sendPaidReaction(
  this: Client,
  chatId: PeerLike,
  messageId: number,
  starCount: number,
  options?: { isPrivate?: boolean }
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  await this.invoke(
    new raw.functions.messages.SendPaidReaction(
      peer,
      messageId,
      starCount,
      BigInt(Math.floor(Math.random() * 2 ** 31)),
      options?.isPrivate ? new raw.types.PaidReactionPrivacyAnonymous() : undefined
    )
  )
  return true
}

/**
 * Get discussion (comments) thread from a channel post.
 */
export async function getDiscussionMessage(
  this: Client,
  chatId: PeerLike,
  messageId: number
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = (await this.invoke(
    new raw.functions.messages.GetDiscussionMessage(peer, messageId)
  )) as any
  return res
}

/**
 * Get replies in a discussion thread.
 * Signature: GetReplies(peer, msg_id, offset_id, offset_date, add_offset, limit, max_id, min_id, hash)
 */
export async function getDiscussionReplies(
  this: Client,
  chatId: PeerLike,
  messageId: number,
  options?: {
    offsetId?: number
    offsetDate?: number
    addOffset?: number
    limit?: number
    maxId?: number
    minId?: number
  }
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = (await this.invoke(
    new raw.functions.messages.GetReplies(
      peer,
      messageId,
      options?.offsetId ?? 0,
      options?.offsetDate ?? 0,
      options?.addOffset ?? 0,
      options?.limit ?? 100,
      options?.maxId ?? 0,
      options?.minId ?? 0,
      0n // hash bigint
    )
  )) as any
  return res?.messages ?? []
}

/**
 * Get the media group a message belongs to.
 */
export async function getMediaGroup(
  this: Client,
  chatId: PeerLike,
  messageId: number
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  if (peer instanceof raw.types.InputPeerChannel) {
    const msgs = (await this.invoke(
      new raw.functions.channels.GetMessages(
        new raw.types.InputChannel(peer.channel_id, peer.access_hash),
        [new raw.types.InputMessageID(messageId)]
      )
    )) as any
    const msg = msgs?.messages?.[0]
    if (!msg?.grouped_id) return []

    // Search around for same group_id
    const history = (await this.invoke(
      new raw.functions.messages.GetHistory(
        peer, messageId + 10, 0, -10, 20, 0, 0, 0n
      )
    )) as any
    return (history?.messages ?? []).filter(
      (m: any) => m?.grouped_id?.toString() === msg.grouped_id?.toString()
    )
  }
  return []
}

/**
 * Start a bot with an optional deep link parameter.
 * Signature: StartBot(bot: InputUser, peer: InputPeer, random_id: bigint, start_param: string)
 */
export async function startBot(
  this: Client,
  botId: PeerLike,
  chatId: PeerLike,
  startParam: string = ''
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const botPeer = await this.peerResolver.resolvePeer(botId)

  // Convert botPeer to InputUser
  let botUser: raw.base.InputUser
  if (botPeer instanceof raw.types.InputPeerUser) {
    botUser = new raw.types.InputUser(botPeer.user_id, botPeer.access_hash)
  } else {
    botUser = botPeer as any
  }

  const res = await this.invoke(
    new raw.functions.messages.StartBot(
      botUser,
      peer,
      BigInt(Math.floor(Math.random() * 2 ** 31)),
      startParam
    )
  )
  return res
}

/**
 * Stop a poll and return the final results.
 */
export async function stopPoll(
  this: Client,
  chatId: PeerLike,
  messageId: number
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.messages.EditMessage(
      peer,
      messageId,
      undefined, // no_webpage
      undefined, // text
      undefined, // entities
      new raw.types.InputMediaPoll(
        new raw.types.Poll(
          BigInt(messageId),
          new raw.types.TextWithEntities('', []),
          [], // answers
          0n, // hash
          true // closed
        )
      )
    )
  )
  return res
}

/**
 * Get count of discussion replies.
 */
export async function getDiscussionRepliesCount(
  this: Client,
  chatId: PeerLike,
  messageId: number
): Promise<number> {
  const replies = await getDiscussionReplies.call(this, chatId, messageId, { limit: 1 })
  return replies.length
}

/**
 * Search global messages count.
 */
export async function searchGlobalCount(
  this: Client,
  query: string
): Promise<number> {
  const msgs = await searchGlobal.call(this, query, { limit: 1 })
  return msgs.length
}

/**
 * Save a GIF document to saved GIFs.
 */
export async function addToGifs(
  this: Client,
  document: raw.base.InputDocument
): Promise<boolean> {
  const res = await this.invoke(
    new raw.functions.messages.SaveGif(document, false)
  )
  return Boolean(res)
}

/**
 * Translate text to target language.
 */
export async function translateText(
  this: Client,
  text: string,
  toLanguage: string
): Promise<string> {
  const res = (await this.invoke(
    new raw.functions.messages.TranslateText(
      toLanguage,
      undefined,
      undefined,
      [new raw.types.TextWithEntities(text, [])]
    )
  )) as any
  return res?.result?.[0]?.text ?? text
}

