//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'
import { User, Chat } from '../../../types/index.js'

export async function addContact(
  this: Client,
  userId: PeerLike,
  firstName: string,
  lastName: string = '',
  phone: string = '',
  sharePhone: boolean = false,
  note?: string
): Promise<User> {
  const inputPeer = await this.peerResolver.resolvePeer(userId)

  const res = await this.invoke(
    new raw.functions.contacts.AddContact(
      inputPeer as any,
      firstName,
      lastName,
      phone,
      sharePhone,
      note ? new raw.types.TextWithEntities(note, []) : undefined
    )
  )

  if ('users' in res && (res as any).users.length > 0) {
    return User._parse((res as any).users[0])
  }
  throw new Error('addContact: Failed to add contact')
}

export async function deleteContacts(
  this: Client,
  userIds: PeerLike | PeerLike[]
): Promise<boolean> {
  const ids = Array.isArray(userIds) ? userIds : [userIds]
  const inputPeers = await Promise.all(
    ids.map(id => this.peerResolver.resolvePeer(id))
  )

  await this.invoke(
    new raw.functions.contacts.DeleteContacts(
      inputPeers as any
    )
  )

  return true
}

export async function getBlockedMessageSenders(
  this: Client,
  blockList: 'main' | 'stories' = 'main',
  offset: number = 0,
  limit: number = 0
): Promise<(User | Chat)[]> {
  const total = limit || 100
  const res = await this.invoke(
    new raw.functions.contacts.GetBlocked(
      offset,
      total,
      blockList === 'stories'
    )
  )

  const results: (User | Chat)[] = []
  if ('users' in res && Array.isArray((res as any).users)) {
    for (const u of (res as any).users) {
      results.push(User._parse(u))
    }
  }
  if ('chats' in res && Array.isArray((res as any).chats)) {
    for (const c of (res as any).chats) {
      results.push(Chat._parse(c))
    }
  }
  return results
}

export async function getContacts(
  this: Client
): Promise<User[]> {
  const res = await this.invoke(
    new raw.functions.contacts.GetContacts(
      0n
    )
  )

  if ('users' in res) {
    return res.users.map((u: any) => User._parse(u))
  }
  return []
}

export async function getContactsCount(
  this: Client
): Promise<number> {
  const res = await this.invoke(
    new raw.functions.contacts.GetContacts(
      0n
    )
  )

  if ('contacts' in res && Array.isArray((res as any).contacts)) {
    return (res as any).contacts.length
  }
  if ('users' in res && Array.isArray((res as any).users)) {
    return (res as any).users.length
  }
  return 0
}

export async function importContacts(
  this: Client,
  contacts: raw.base.InputContact[]
): Promise<raw.base.contacts.ImportedContacts> {
  const res = await this.invoke(
    new raw.functions.contacts.ImportContacts(contacts)
  )
  return res as raw.base.contacts.ImportedContacts
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

export async function setContactNote(
  this: Client,
  userId: PeerLike,
  note?: string
): Promise<boolean> {
  const inputPeer = await this.peerResolver.resolvePeer(userId)
  const textObj = note ? new raw.types.TextWithEntities(note, []) : new raw.types.TextWithEntities('', [])

  const res = await this.invoke(
    new raw.functions.contacts.UpdateContactNote(
      inputPeer as any,
      textObj
    )
  )
  return Boolean(res)
}

