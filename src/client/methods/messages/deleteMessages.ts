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
import type { Client } from '../../Client.js'
import type { PeerLike } from '../../PeerResolver.js'

export async function deleteMessages(
  this: Client,
  chatId: PeerLike,
  messageIds: number | number[],
  revoke: boolean = true,
): Promise<boolean> {
  const ids = Array.isArray(messageIds) ? messageIds : [messageIds]
  const peer = await this.peerResolver.resolvePeer(chatId)

  if (peer instanceof raw.types.InputPeerChannel) {
    const channel = new raw.types.InputChannel(peer.channel_id, peer.access_hash)
    const res = await this.invoke(
      new raw.functions.channels.DeleteMessages(channel, ids)
    )
    return Boolean(res && res.pts_count > 0)
  }

  const res = await this.invoke(
    new raw.functions.messages.DeleteMessages(ids, revoke)
  )

  return Boolean(res && res.pts_count > 0)
}
