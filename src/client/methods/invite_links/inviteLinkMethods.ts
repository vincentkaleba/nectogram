//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

export interface CreateInviteLinkOptions {
  name?: string
  expireDate?: number
  usageLimit?: number
  createsJoinRequest?: boolean
}

export async function createChatInviteLink(
  this: Client,
  chatId: PeerLike,
  options?: CreateInviteLinkOptions
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.messages.ExportChatInvite(
      peer,
      undefined,
      options?.createsJoinRequest ? true : undefined,
      options?.expireDate,
      options?.usageLimit,
      options?.name
    )
  )

  return res
}

export async function editChatInviteLink(
  this: Client,
  chatId: PeerLike,
  inviteLink: string,
  options?: CreateInviteLinkOptions
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.messages.EditExportedChatInvite(
      peer,
      inviteLink,
      undefined,
      options?.expireDate,
      options?.usageLimit,
      options?.createsJoinRequest ? true : undefined,
      options?.name
    )
  )

  return res
}

export async function revokeChatInviteLink(
  this: Client,
  chatId: PeerLike,
  inviteLink: string
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.messages.EditExportedChatInvite(
      peer,
      inviteLink,
      true // revoked
    )
  )

  return res
}

export async function deleteChatInviteLink(
  this: Client,
  chatId: PeerLike,
  inviteLink: string
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  await this.invoke(
    new raw.functions.messages.DeleteExportedChatInvite(
      peer,
      inviteLink
    )
  )

  return true
}

export async function approveChatJoinRequest(
  this: Client,
  chatId: PeerLike,
  userId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const userPeer = await this.peerResolver.resolvePeer(userId)

  await this.invoke(
    new raw.functions.messages.HideChatJoinRequest(
      peer,
      userPeer as any,
      true // approved
    )
  )

  return true
}

export async function declineChatJoinRequest(
  this: Client,
  chatId: PeerLike,
  userId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const userPeer = await this.peerResolver.resolvePeer(userId)

  await this.invoke(
    new raw.functions.messages.HideChatJoinRequest(
      peer,
      userPeer as any,
      false // declined
    )
  )

  return true
}
