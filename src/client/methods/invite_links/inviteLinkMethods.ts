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

export async function approveAllChatJoinRequests(
  this: Client,
  chatId: PeerLike,
  inviteLink?: string
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  await this.invoke(
    new raw.functions.messages.HideAllChatJoinRequests(
      peer,
      true, // approved
      inviteLink
    )
  )

  return true
}

export async function declineAllChatJoinRequests(
  this: Client,
  chatId: PeerLike,
  inviteLink?: string
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  await this.invoke(
    new raw.functions.messages.HideAllChatJoinRequests(
      peer,
      false, // declined
      inviteLink
    )
  )

  return true
}

export async function deleteChatAdminInviteLinks(
  this: Client,
  chatId: PeerLike,
  adminId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const adminPeer = await this.peerResolver.resolvePeer(adminId)

  const res = await this.invoke(
    new raw.functions.messages.DeleteRevokedExportedChatInvites(
      peer,
      adminPeer as any
    )
  )

  return Boolean(res)
}

export async function exportChatInviteLink(
  this: Client,
  chatId: PeerLike
): Promise<string> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.messages.ExportChatInvite(
      peer,
      true // legacy_revoke_permanent
    )
  )

  return (res as any)?.link ?? ''
}

export async function getChatAdminInviteLinks(
  this: Client,
  chatId: PeerLike,
  adminId: PeerLike,
  revoked: boolean = false,
  limit: number = 0
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const adminPeer = await this.peerResolver.resolvePeer(adminId)

  const total = limit || 100
  const res = await this.invoke(
    new raw.functions.messages.GetExportedChatInvites(
      peer,
      adminPeer as any,
      total,
      revoked
    )
  )

  return (res as any)?.invites ?? []
}

export async function getChatAdminInviteLinksCount(
  this: Client,
  chatId: PeerLike,
  adminId: PeerLike,
  revoked: boolean = false
): Promise<number> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const adminPeer = await this.peerResolver.resolvePeer(adminId)

  const res = await this.invoke(
    new raw.functions.messages.GetExportedChatInvites(
      peer,
      adminPeer as any,
      1,
      revoked
    )
  )

  return (res as any)?.count ?? 0
}

export async function getChatAdminsWithInviteLinks(
  this: Client,
  chatId: PeerLike
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.messages.GetAdminsWithInvites(
      peer
    )
  )

  return (res as any)?.admins ?? []
}

export async function getChatInviteLink(
  this: Client,
  chatId: PeerLike,
  inviteLink: string
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.messages.GetExportedChatInvite(
      peer,
      inviteLink
    )
  )

  return (res as any)?.invite ?? res
}

export async function getChatInviteLinkJoiners(
  this: Client,
  chatId: PeerLike,
  inviteLink: string,
  limit: number = 0
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const total = limit || 100

  const res = await this.invoke(
    new raw.functions.messages.GetChatInviteImporters(
      peer,
      0,
      new raw.types.InputUserEmpty(),
      total,
      undefined,
      undefined,
      inviteLink
    )
  )

  return (res as any)?.importers ?? []
}

export async function getChatInviteLinkJoinersCount(
  this: Client,
  chatId: PeerLike,
  inviteLink: string
): Promise<number> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const res = await this.invoke(
    new raw.functions.messages.GetChatInviteImporters(
      peer,
      0,
      new raw.types.InputUserEmpty(),
      1,
      undefined,
      undefined,
      inviteLink
    )
  )

  return (res as any)?.count ?? 0
}

export async function getChatJoinRequests(
  this: Client,
  chatId: PeerLike,
  limit: number = 0,
  query: string = ''
): Promise<any> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const total = limit || 100

  const res = await this.invoke(
    new raw.functions.messages.GetChatInviteImporters(
      peer,
      0,
      new raw.types.InputUserEmpty(),
      total,
      true, // requested
      undefined,
      undefined,
      query || undefined
    )
  )

  return (res as any)?.importers ?? []
}

