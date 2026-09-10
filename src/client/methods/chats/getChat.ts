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

import * as raw from '../../../raw/index.js'
import { Chat } from '../../../types/index.js'
import type { Client } from '../../Client.js'
import type { PeerLike } from '../../PeerResolver.js'

export async function getChat(this: Client, chatId: PeerLike): Promise<Chat> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  if (peer instanceof raw.types.InputPeerChannel) {
    const channel = new raw.types.InputChannel(peer.channel_id, peer.access_hash)
    const fullChannel = await this.invoke(
      new raw.functions.channels.GetFullChannel(channel)
    )

    let title: string | undefined
    let username: string | undefined
    let membersCount: number | undefined

    if (fullChannel && fullChannel.chats && fullChannel.chats.length > 0) {
      const ch = fullChannel.chats[0]
      if (ch instanceof raw.types.Channel) {
        title = ch.title
        username = ch.username
      }
    }

    if (fullChannel && fullChannel.full_chat && fullChannel.full_chat instanceof raw.types.ChannelFull) {
      membersCount = fullChannel.full_chat.participants_count
    }

    return new Chat({
      id: peer.channel_id,
      type: 'channel',
      title,
      username,
      membersCount,
    })
  } else if (peer instanceof raw.types.InputPeerUser) {
    const user = new raw.types.InputUser(peer.user_id, peer.access_hash)
    const fullUser = await this.invoke(
      new raw.functions.users.GetFullUser(user)
    )

    let title: string | undefined
    let username: string | undefined

    if (fullUser && fullUser.users && fullUser.users.length > 0) {
      const u = fullUser.users[0]
      if (u instanceof raw.types.User) {
        title = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username
        username = u.username
      }
    }

    return new Chat({
      id: peer.user_id,
      type: 'private',
      title,
      username,
    })
  }

  throw new Error('getChat: Target chat peer resolution or chat type is not supported')
}
