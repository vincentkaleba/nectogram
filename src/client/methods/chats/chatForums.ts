//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

/**
 * Create a new forum topic in a supergroup.
 * Forum topic functions are under messages.* namespace.
 */
export async function createForumTopic(
  this: Client,
  chatId: PeerLike,
  title: string,
  options?: {
    iconColor?: number
    iconEmojiId?: bigint
  }
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = await this.invoke(
    new raw.functions.messages.CreateForumTopic(
      peer,
      title,
      BigInt(Math.floor(Math.random() * 2 ** 31)),
      undefined,
      options?.iconColor ?? undefined,
      options?.iconEmojiId ?? undefined
    )
  )
  return res
}

/**
 * Edit an existing forum topic.
 */
export async function editForumTopic(
  this: Client,
  chatId: PeerLike,
  topicId: number,
  options?: {
    title?: string
    iconEmojiId?: bigint
    closed?: boolean
    hidden?: boolean
  }
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  await this.invoke(
    new raw.functions.messages.EditForumTopic(
      peer,
      topicId,
      options?.title ?? undefined,
      options?.iconEmojiId ?? undefined,
      options?.closed ?? undefined,
      options?.hidden ?? undefined
    )
  )
  return true
}

/**
 * Close a forum topic (prevent new messages).
 */
export async function closeForumTopic(
  this: Client,
  chatId: PeerLike,
  topicId: number
): Promise<boolean> {
  return editForumTopic.call(this, chatId, topicId, { closed: true })
}

/**
 * Delete a forum topic and all its messages.
 */
export async function deleteForumTopic(
  this: Client,
  chatId: PeerLike,
  topicId: number
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  // messages.DeleteTopicHistory takes InputPeer + top_msg_id
  await this.invoke(
    new raw.functions.messages.DeleteTopicHistory(peer, topicId)
  )
  return true
}

/**
 * Pin a forum topic.
 */
export async function pinForumTopic(
  this: Client,
  chatId: PeerLike,
  topicId: number
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  await this.invoke(
    new raw.functions.messages.UpdatePinnedForumTopic(peer, topicId, true)
  )
  return true
}

/**
 * Unpin a forum topic.
 */
export async function unpinForumTopic(
  this: Client,
  chatId: PeerLike,
  topicId: number
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  await this.invoke(
    new raw.functions.messages.UpdatePinnedForumTopic(peer, topicId, false)
  )
  return true
}

/**
 * Get forum topics in a supergroup.
 */
export async function getForumTopics(
  this: Client,
  chatId: PeerLike,
  options?: {
    query?: string
    offsetDate?: number
    offsetId?: number
    offsetTopic?: number
    limit?: number
  }
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = (await this.invoke(
    new raw.functions.messages.GetForumTopics(
      peer,
      options?.offsetDate ?? 0,
      options?.offsetId ?? 0,
      options?.offsetTopic ?? 0,
      options?.limit ?? 100,
      options?.query ?? undefined
    )
  )) as any
  return res?.topics ?? []
}

/**
 * Get specific forum topics by their IDs.
 */
export async function getForumTopicsById(
  this: Client,
  chatId: PeerLike,
  topicIds: number[]
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = (await this.invoke(
    new raw.functions.messages.GetForumTopicsByID(peer, topicIds)
  )) as any
  return res?.topics ?? []
}

/**
 * Get similar channels for a given channel.
 */
export async function getSimilarChannels(
  this: Client,
  chatId: PeerLike
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('getSimilarChannels: only supported for channels')
  }
  const res = (await this.invoke(
    new raw.functions.channels.GetChannelRecommendations(
      new raw.types.InputChannel(peer.channel_id, peer.access_hash)
    )
  )) as any
  return res?.chats ?? []
}

/**
 * Get chats that can be used as discussion groups for a channel.
 */
export async function getSuitableDiscussionChats(this: Client): Promise<any[]> {
  const res = (await this.invoke(
    new raw.functions.channels.GetGroupsForDiscussion()
  )) as any
  return res?.chats ?? []
}

/**
 * Get the event log of a channel/supergroup (admin log).
 */
export async function getChatEventLog(
  this: Client,
  chatId: PeerLike,
  options?: {
    query?: string
    offsetId?: number
    limit?: number
    adminIds?: PeerLike[]
  }
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('getChatEventLog: only supported for channels/supergroups')
  }

  const channel = new raw.types.InputChannel(peer.channel_id, peer.access_hash)
  let admins: raw.base.InputUser[] | undefined

  if (options?.adminIds) {
    admins = []
    for (const id of options.adminIds) {
      const p = await this.peerResolver.resolvePeer(id)
      if (p instanceof raw.types.InputPeerUser) {
        admins.push(new raw.types.InputUser(p.user_id, p.access_hash))
      } else if (p instanceof raw.types.InputPeerSelf) {
        admins.push(new raw.types.InputUserSelf())
      }
    }
  }

  const maxId = BigInt(options?.offsetId ?? 0)
  const res = (await this.invoke(
    new raw.functions.channels.GetAdminLog(
      channel,
      options?.query ?? '',
      maxId,
      0n,
      options?.limit ?? 100,
      undefined,
      admins
    )
  )) as any
  return res?.events ?? []
}
