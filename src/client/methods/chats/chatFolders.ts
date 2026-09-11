//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

export interface DialogFilterInput {
  title: string
  pinnedPeers?: PeerLike[]
  includePeers?: PeerLike[]
  excludePeers?: PeerLike[]
  excludeMuted?: boolean
  excludeRead?: boolean
  excludeArchived?: boolean
  includeContacts?: boolean
  includeNonContacts?: boolean
  includeGroups?: boolean
  includeBroadcasts?: boolean
  includeBots?: boolean
  emoticon?: string
}

/**
 * Get all chat folders.
 */
export async function getFolders(this: Client): Promise<any[]> {
  const res = (await this.invoke(new raw.functions.messages.GetDialogFilters())) as any
  return Array.isArray(res) ? res : res?.filters ?? []
}

/**
 * Create a new chat folder.
 */
export async function createFolder(
  this: Client,
  options: DialogFilterInput
): Promise<boolean> {
  const existing = (await this.invoke(new raw.functions.messages.GetDialogFilters())) as any
  const filters = Array.isArray(existing) ? existing : existing?.filters ?? []
  const currentIds = filters
    .filter((f: any) => f instanceof raw.types.DialogFilter || f.id !== undefined)
    .map((f: any) => f.id ?? 0)
  const newId = Math.max(2, ...currentIds) + 1

  const resolvePeers = async (peers?: PeerLike[]) =>
    peers ? await Promise.all(peers.map((p) => this.peerResolver.resolvePeer(p))) : []

  const pinnedPeers = await resolvePeers(options.pinnedPeers)
  const includePeers = await resolvePeers(options.includePeers)
  const excludePeers = await resolvePeers(options.excludePeers)

  await this.invoke(
    new raw.functions.messages.UpdateDialogFilter(
      newId,
      new raw.types.DialogFilter(
        newId,
        new raw.types.TextWithEntities(options.title, []),
        pinnedPeers,
        includePeers,
        excludePeers,
        options.includeContacts ?? false,
        options.includeNonContacts ?? false,
        options.includeGroups ?? false,
        options.includeBroadcasts ?? false,
        options.includeBots ?? false,
        options.excludeMuted ?? false,
        options.excludeRead ?? false,
        options.excludeArchived ?? false,
        undefined,
        options.emoticon ?? undefined
      )
    )
  )
  return true
}

/**
 * Edit an existing chat folder.
 */
export async function editFolder(
  this: Client,
  folderId: number,
  options: Partial<DialogFilterInput>
): Promise<boolean> {
  const resolvePeers = async (peers?: PeerLike[]) =>
    peers ? await Promise.all(peers.map((p) => this.peerResolver.resolvePeer(p))) : []

  const pinnedPeers = await resolvePeers(options.pinnedPeers)
  const includePeers = await resolvePeers(options.includePeers)
  const excludePeers = await resolvePeers(options.excludePeers)

  await this.invoke(
    new raw.functions.messages.UpdateDialogFilter(
      folderId,
      new raw.types.DialogFilter(
        folderId,
        new raw.types.TextWithEntities(options.title ?? '', []),
        pinnedPeers,
        includePeers,
        excludePeers,
        options.includeContacts ?? false,
        options.includeNonContacts ?? false,
        options.includeGroups ?? false,
        options.includeBroadcasts ?? false,
        options.includeBots ?? false,
        options.excludeMuted ?? false,
        options.excludeRead ?? false,
        options.excludeArchived ?? false,
        undefined,
        options.emoticon ?? undefined
      )
    )
  )
  return true
}

/**
 * Delete a chat folder by ID.
 */
export async function deleteFolder(
  this: Client,
  folderId: number
): Promise<boolean> {
  await this.invoke(new raw.functions.messages.UpdateDialogFilter(folderId))
  return true
}

/**
 * Reorder chat folders.
 */
export async function reorderFolders(
  this: Client,
  folderIds: number[]
): Promise<boolean> {
  await this.invoke(new raw.functions.messages.UpdateDialogFiltersOrder(folderIds))
  return true
}

/**
 * Toggle chat folder tags on/off.
 */
export async function toggleFolderTags(
  this: Client,
  enabled: boolean
): Promise<boolean> {
  await this.invoke(new raw.functions.messages.ToggleDialogFilterTags(enabled))
  return true
}

/**
 * Create an invite link for a chat folder.
 */
export async function createFolderInviteLink(
  this: Client,
  folderId: number,
  peers: PeerLike[]
): Promise<string> {
  const resolvedPeers = await Promise.all(peers.map((p) => this.peerResolver.resolvePeer(p)))
  const res = (await this.invoke(
    new raw.functions.chatlists.ExportChatlistInvite(
      new raw.types.InputChatlistDialogFilter(folderId),
      `Folder ${folderId}`,
      resolvedPeers
    )
  )) as any
  return res?.invite?.url ?? res?.url ?? ''
}

/**
 * Delete a folder invite link.
 */
export async function deleteFolderInviteLink(
  this: Client,
  folderId: number,
  link: string
): Promise<boolean> {
  await this.invoke(
    new raw.functions.chatlists.DeleteExportedInvite(
      new raw.types.InputChatlistDialogFilter(folderId),
      link
    )
  )
  return true
}

/**
 * Get folder invite links.
 */
export async function getFolderInviteLinks(
  this: Client,
  folderId: number
): Promise<any[]> {
  const res = (await this.invoke(
    new raw.functions.chatlists.GetExportedInvites(
      new raw.types.InputChatlistDialogFilter(folderId)
    )
  )) as any
  return res?.invites ?? []
}

/**
 * Get chats suitable for adding to a folder invite link.
 */
export async function getChatsForFolderInviteLink(
  this: Client,
  folderId: number
): Promise<any[]> {
  const res = (await this.invoke(
    new raw.functions.chatlists.GetLeaveChatlistSuggestions(
      new raw.types.InputChatlistDialogFilter(folderId)
    )
  )) as any
  return res?.chats ?? []
}

/**
 * Join a folder by its invite link.
 */
export async function joinFolder(
  this: Client,
  link: string,
  peerIds?: PeerLike[]
): Promise<any> {
  const slug = link.split('/').pop() ?? link
  const resolvedPeers = peerIds
    ? await Promise.all(peerIds.map((p) => this.peerResolver.resolvePeer(p)))
    : []
  const res = await this.invoke(
    new raw.functions.chatlists.JoinChatlistInvite(slug, resolvedPeers)
  )
  return res
}

/**
 * Leave a folder (and optionally its chats).
 */
export async function leaveFolder(
  this: Client,
  folderId: number,
  peers?: PeerLike[]
): Promise<boolean> {
  const resolvedPeers = peers
    ? await Promise.all(peers.map((p) => this.peerResolver.resolvePeer(p)))
    : []
  await this.invoke(
    new raw.functions.chatlists.LeaveChatlist(
      new raw.types.InputChatlistDialogFilter(folderId),
      resolvedPeers
    )
  )
  return true
}
