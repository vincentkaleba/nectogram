//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

/**
 * Resolve a peer ID, username, link or phone number into an InputPeer.
 */
export async function resolvePeer(
  this: Client,
  peerId: PeerLike
): Promise<raw.base.InputPeer> {
  return await this.peerResolver.resolvePeer(peerId)
}

/**
 * Invoke a raw MTProto TL function query.
 */
export async function invokeRaw<T = any>(
  this: Client,
  query: raw.TLObject
): Promise<T> {
  return await this.invoke(query)
}

/**
 * Restore missed updates for the time while the client was offline.
 */
export async function recoverGaps(
  this: Client,
  ids?: number | number[]
): Promise<{ messageUpdates: number; otherUpdates: number }> {
  let messageUpdates = 0
  let otherUpdates = 0

  const targetIds = ids ? (Array.isArray(ids) ? ids : [ids]) : []

  for (const id of targetIds) {
    try {
      if (id < 0) {
        // Channel difference
        const peer = await this.peerResolver.resolvePeer(id)
        if (peer instanceof raw.types.InputPeerChannel) {
          const channel = new raw.types.InputChannel(peer.channel_id, peer.access_hash)
          const diff = (await this.invoke(
            new raw.functions.updates.GetChannelDifference(
              channel,
              new raw.types.ChannelMessagesFilterEmpty(),
              0, // pts
              100, // limit
              false // force
            )
          )) as any

          if (diff?.new_messages) {
            messageUpdates += diff.new_messages.length
          }
          if (diff?.other_updates) {
            otherUpdates += diff.other_updates.length
          }
        }
      } else {
        // Global difference
        const diff = (await this.invoke(
          new raw.functions.updates.GetDifference(
            0, // pts
            0, // date
            0 // qts
          )
        )) as any

        if (diff?.new_messages) {
          messageUpdates += diff.new_messages.length
        }
        if (diff?.other_updates) {
          otherUpdates += diff.other_updates.length
        }
      }
    } catch {
      // Continue gap recovery for remaining chats
    }
  }

  return { messageUpdates, otherUpdates }
}
