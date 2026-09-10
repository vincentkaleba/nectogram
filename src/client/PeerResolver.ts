//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//
//  This file is part of Nectogram.
//
//  Nectogram is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Lesser General Public License as published
//  by the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  Nectogram is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Lesser General Public License for more details.
//
//  You should have received a copy of the GNU Lesser General Public License
//  along with Nectogram.  If not, see <http://www.gnu.org/licenses/>.

import * as raw from '../raw/index.js'
import { Storage, PeerInfo } from '../storage/index.js'

export type PeerLike = string | number | bigint | raw.base.InputPeer | raw.base.InputUser | raw.base.InputChannel

export class PeerResolver {
  private readonly _storage: Storage
  private readonly _invokeFn?: (query: raw.TLObject) => Promise<any>

  constructor(storage: Storage, invokeFn?: (query: raw.TLObject) => Promise<any>) {
    this._storage = storage
    this._invokeFn = invokeFn
  }

  /**
   * Resolve a peer identifier (string, number, bigint, "me", "@username") to a raw InputPeer TL Object.
   */
  public async resolvePeer(peer: PeerLike): Promise<raw.base.InputPeer> {
    if (typeof peer === 'object' && peer !== null) {
      if ('QUALNAME' in peer) {
        if (peer instanceof raw.types.InputPeerSelf) return peer
        if (peer instanceof raw.types.InputPeerUser) return peer
        if (peer instanceof raw.types.InputPeerChannel) return peer
        if (peer instanceof raw.types.InputPeerChat) return peer
        if (peer instanceof raw.types.InputUser) {
          return new raw.types.InputPeerUser(peer.user_id, peer.access_hash)
        }
        if (peer instanceof raw.types.InputChannel) {
          return new raw.types.InputPeerChannel(peer.channel_id, peer.access_hash)
        }
      }
      return peer as raw.base.InputPeer
    }

    if (typeof peer === 'string') {
      const clean = peer.trim().toLowerCase().replace(/^@/, '')

      if (clean === 'me' || clean === 'self') {
        return new raw.types.InputPeerSelf()
      }

      // Check storage peer cache by username
      const cached = await this._storage.getPeerByUsername(clean)
      if (cached) {
        return this.peerInfoToInputPeer(cached)
      }

      // Check storage peer cache by phone if starts with +
      if (peer.startsWith('+')) {
        const cachedPhone = await this._storage.getPeerByPhone(peer)
        if (cachedPhone) {
          return this.peerInfoToInputPeer(cachedPhone)
        }
      }

      // If not in cache and invoke function is available, resolve via Telegram API contacts.ResolveUsername
      if (this._invokeFn) {
        try {
          const res = await this._invokeFn(new raw.functions.contacts.ResolveUsername(clean))
          if (res && res.users && res.users.length > 0) {
            const u = res.users[0]
            if (u instanceof raw.types.User) {
              const peerInfo: PeerInfo = {
                id: u.id,
                accessHash: u.access_hash ?? 0n,
                type: 'user',
                username: u.username,
                phone: u.phone,
              }
              await this._storage.updatePeer(peerInfo)
              return new raw.types.InputPeerUser(u.id, u.access_hash ?? 0n)
            }
          } else if (res && res.chats && res.chats.length > 0) {
            const c = res.chats[0]
            if (c instanceof raw.types.Channel) {
              const peerInfo: PeerInfo = {
                id: c.id,
                accessHash: c.access_hash ?? 0n,
                type: 'channel',
                username: c.username,
              }
              await this._storage.updatePeer(peerInfo)
              return new raw.types.InputPeerChannel(c.id, c.access_hash ?? 0n)
            }
          }
        } catch {
          // Fall through if resolution fails
        }
      }

      // If string is numeric
      if (/^-?\d+$/.test(peer)) {
        peer = BigInt(peer)
      } else {
        throw new Error(`Cannot resolve peer username or format "${peer}"`)
      }
    }

    if (typeof peer === 'number' || typeof peer === 'bigint') {
      const id = BigInt(peer)
      if (id === 0n) {
        return new raw.types.InputPeerSelf()
      }

      const cached = await this._storage.getPeerById(id)
      if (cached) {
        return this.peerInfoToInputPeer(cached)
      }

      if (id < 0n) {
        const idStr = id.toString()
        if (idStr.startsWith('-100')) {
          const channelId = BigInt(idStr.substring(4))
          return new raw.types.InputPeerChannel(channelId, 0n)
        } else {
          const chatId = -id
          return new raw.types.InputPeerChat(chatId)
        }
      }

      return new raw.types.InputPeerUser(id, 0n)
    }

    throw new Error(`Invalid peer type provided: ${typeof peer}`)
  }

  /**
   * Convert cached PeerInfo to raw InputPeer TL object.
   */
  public peerInfoToInputPeer(info: PeerInfo): raw.base.InputPeer {
    if (info.type === 'channel') {
      return new raw.types.InputPeerChannel(info.id, info.accessHash)
    } else if (info.type === 'chat' || info.type === 'group') {
      return new raw.types.InputPeerChat(info.id)
    }
    return new raw.types.InputPeerUser(info.id, info.accessHash)
  }
}
