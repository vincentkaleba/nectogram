//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'
import { Chat } from '../../../types/index.js'

export async function createChannel(
  this: Client,
  title: string,
  description: string = ''
): Promise<Chat> {
  const res = await this.invoke(
    new raw.functions.channels.CreateChannel(
      title,
      description,
      true // broadcast channel
    )
  )

  const chats = 'chats' in res ? (res as any).chats : []
  return Chat._parse(chats[0])
}

export async function createSupergroup(
  this: Client,
  title: string,
  description: string = ''
): Promise<Chat> {
  const res = await this.invoke(
    new raw.functions.channels.CreateChannel(
      title,
      description,
      false, // megagroup flag
      true
    )
  )

  const chats = 'chats' in res ? (res as any).chats : []
  return Chat._parse(chats[0])
}

export async function createGroup(
  this: Client,
  title: string,
  users: PeerLike[]
): Promise<Chat> {
  const inputUsers = await Promise.all(
    users.map(u => this.peerResolver.resolvePeer(u))
  )

  const res = await this.invoke(
    new raw.functions.messages.CreateChat(
      inputUsers as any,
      title
    )
  )

  const chats = 'chats' in res ? (res as any).chats : []
  return Chat._parse(chats[0])
}
