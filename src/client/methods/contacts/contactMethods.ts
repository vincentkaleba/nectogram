//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'
import { User } from '../../../types/index.js'

export async function addContact(
  this: Client,
  userId: PeerLike,
  firstName: string,
  lastName: string = '',
  phone: string = ''
): Promise<User> {
  const inputPeer = await this.peerResolver.resolvePeer(userId)

  const res = await this.invoke(
    new raw.functions.contacts.AddContact(
      inputPeer as any,
      firstName,
      lastName,
      phone
    )
  )

  if ('users' in res && (res as any).users.length > 0) {
    return User._parse((res as any).users[0])
  }
  throw new Error('addContact: Failed to add contact')
}

export async function deleteContacts(
  this: Client,
  userIds: PeerLike[]
): Promise<boolean> {
  const inputPeers = await Promise.all(
    userIds.map(id => this.peerResolver.resolvePeer(id))
  )

  await this.invoke(
    new raw.functions.contacts.DeleteContacts(
      inputPeers as any
    )
  )

  return true
}

export async function getContacts(
  this: Client
): Promise<User[]> {
  const res = await this.invoke(
    new raw.functions.contacts.GetContacts(
      0n // hash
    )
  )

  if ('users' in res) {
    return res.users.map((u: any) => User._parse(u))
  }
  return []
}

export async function searchContacts(
  this: Client,
  query: string,
  limit: number = 100
): Promise<User[]> {
  const res = await this.invoke(
    new raw.functions.contacts.Search(
      query,
      limit
    )
  )

  if ('users' in res) {
    return res.users.map((u: any) => User._parse(u))
  }
  return []
}
