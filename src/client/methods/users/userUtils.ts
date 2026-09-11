//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'
import { User } from '../../../types/index.js'

export async function getUsers(
  this: Client,
  userIds: PeerLike[]
): Promise<User[]> {
  const inputUsers: raw.base.InputUser[] = []
  for (const uid of userIds) {
    const peer = await this.peerResolver.resolvePeer(uid)
    if (peer instanceof raw.types.InputPeerUser) {
      inputUsers.push(new raw.types.InputUser(peer.user_id, peer.access_hash))
    } else if (peer instanceof raw.types.InputPeerSelf) {
      inputUsers.push(new raw.types.InputUserSelf())
    }
  }

  const res = await this.invoke(
    new raw.functions.users.GetUsers(inputUsers)
  )

  if (Array.isArray(res)) {
    return res
      .filter((u) => u instanceof raw.types.User)
      .map((u) => User._parse(u as raw.types.User))
  }
  return []
}

export async function blockUser(
  this: Client,
  userId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(userId)

  const res = await this.invoke(
    new raw.functions.contacts.Block(peer)
  )
  return Boolean(res)
}

export async function unblockUser(
  this: Client,
  userId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(userId)

  const res = await this.invoke(
    new raw.functions.contacts.Unblock(peer)
  )
  return Boolean(res)
}
