//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'

/** Helper: Convert InputPeer → InputUser (required by some TL functions) */
function peerToInputUser(peer: raw.base.InputPeer): raw.base.InputUser {
  if (peer instanceof raw.types.InputPeerUser) {
    return new raw.types.InputUser(peer.user_id, peer.access_hash)
  }
  if (peer instanceof raw.types.InputPeerSelf) {
    return new raw.types.InputUserSelf()
  }
  // For channels/chats cast as any - some APIs accept InputPeer there
  return peer as any
}

/** Helper: Convert InputPeer → InputChannel */
function peerToInputChannel(peer: raw.base.InputPeer): raw.types.InputChannel {
  if (peer instanceof raw.types.InputPeerChannel) {
    return new raw.types.InputChannel(peer.channel_id, peer.access_hash)
  }
  throw new Error('Expected a channel/supergroup peer')
}

export interface ChatAdminRightsInput {
  isAnonymous?: boolean
  canManageChat?: boolean
  canDeleteMessages?: boolean
  canManageVideoChats?: boolean
  canRestrictMembers?: boolean
  canPromoteMembers?: boolean
  canChangeInfo?: boolean
  canInviteUsers?: boolean
  canPostMessages?: boolean
  canEditMessages?: boolean
  canPinMessages?: boolean
  canManageTopics?: boolean
  canPostStories?: boolean
  canEditStories?: boolean
  canDeleteStories?: boolean
  customTitle?: string
}

export interface ChatPermissionsInput {
  canSendMessages?: boolean
  canSendMediaMessages?: boolean
  canSendPolls?: boolean
  canSendOtherMessages?: boolean
  canAddWebPagePreviews?: boolean
  canChangeInfo?: boolean
  canInviteUsers?: boolean
  canPinMessages?: boolean
  canManageTopics?: boolean
  untilDate?: number
}

/**
 * Promote a user to admin in a supergroup or channel.
 */
export async function promoteChatMember(
  this: Client,
  chatId: PeerLike,
  userId: PeerLike,
  rights?: ChatAdminRightsInput
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const userPeer = await this.peerResolver.resolvePeer(userId)

  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('promoteChatMember: only supported for channels/supergroups')
  }

  const channel = peerToInputChannel(peer)
  const user = peerToInputUser(userPeer)

  // Try to get existing rank
  let rank = ''
  try {
    const participant = (await this.invoke(
      new raw.functions.channels.GetParticipant(channel, userPeer)
    )) as any
    if (participant?.participant instanceof raw.types.ChannelParticipantAdmin) {
      rank = participant.participant.rank || ''
    }
  } catch {
    // participant not found, that's fine
  }

  await this.invoke(
    new raw.functions.channels.EditAdmin(
      channel,
      user,
      new raw.types.ChatAdminRights(
        rights?.canChangeInfo ?? true,
        rights?.canPostMessages ?? false,
        rights?.canEditMessages ?? false,
        rights?.canDeleteMessages ?? true,
        rights?.canRestrictMembers ?? true,
        rights?.canInviteUsers ?? true,
        rights?.canPinMessages ?? false,
        rights?.canPromoteMembers ?? false,
        rights?.isAnonymous ?? false,
        rights?.canManageVideoChats ?? false,
        rights?.canManageChat ?? true,
        rights?.canManageTopics ?? false,
        rights?.canPostStories ?? false,
        rights?.canEditStories ?? false,
        rights?.canDeleteStories ?? false
      ),
      rights?.customTitle ?? rank
    )
  )
  return true
}

/**
 * Restrict a member in a supergroup.
 */
export async function restrictChatMember(
  this: Client,
  chatId: PeerLike,
  userId: PeerLike,
  permissions?: ChatPermissionsInput
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const userPeer = await this.peerResolver.resolvePeer(userId)

  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('restrictChatMember: only supported for channels/supergroups')
  }

  const untilDate = permissions?.untilDate ?? 0

  await this.invoke(
    new raw.functions.channels.EditBanned(
      peerToInputChannel(peer),
      userPeer,
      new raw.types.ChatBannedRights(
        untilDate,
        undefined,
        !(permissions?.canSendMessages ?? false),
        !(permissions?.canSendMediaMessages ?? false),
        undefined,
        undefined,
        undefined,
        undefined,
        !(permissions?.canAddWebPagePreviews ?? false),
        !(permissions?.canSendPolls ?? false),
        !(permissions?.canChangeInfo ?? false),
        !(permissions?.canInviteUsers ?? false),
        !(permissions?.canPinMessages ?? false),
        !(permissions?.canManageTopics ?? false)
      )
    )
  )
  return true
}

/**
 * Set the chat photo.
 */
export async function setChatPhoto(
  this: Client,
  chatId: PeerLike,
  options: {
    photo?: string | Uint8Array
    video?: string | Uint8Array
    videoStartTs?: number
  }
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const uploadedPhoto = options.photo ? await this.saveFile(options.photo as any) : undefined
  const uploadedVideo = options.video ? await this.saveFile(options.video as any) : undefined

  const chatPhoto = new raw.types.InputChatUploadedPhoto(
    uploadedPhoto ?? undefined,
    uploadedVideo ?? undefined,
    options.videoStartTs ?? undefined
  )

  if (peer instanceof raw.types.InputPeerChannel) {
    await this.invoke(
      new raw.functions.channels.EditPhoto(peerToInputChannel(peer), chatPhoto)
    )
  } else if (peer instanceof raw.types.InputPeerChat) {
    await this.invoke(
      new raw.functions.messages.EditChatPhoto(peer.chat_id, chatPhoto)
    )
  } else {
    throw new Error('setChatPhoto: unsupported peer type')
  }
  return true
}

/**
 * Delete the current chat photo.
 */
export async function deleteChatPhoto(
  this: Client,
  chatId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const noPhoto = new raw.types.InputChatPhotoEmpty()

  if (peer instanceof raw.types.InputPeerChannel) {
    await this.invoke(
      new raw.functions.channels.EditPhoto(peerToInputChannel(peer), noPhoto)
    )
  } else if (peer instanceof raw.types.InputPeerChat) {
    await this.invoke(
      new raw.functions.messages.EditChatPhoto(peer.chat_id, noPhoto)
    )
  } else {
    throw new Error('deleteChatPhoto: unsupported peer type')
  }
  return true
}

/**
 * Set default permissions for all members of a group.
 */
export async function setChatPermissions(
  this: Client,
  chatId: PeerLike,
  permissions: ChatPermissionsInput
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  const bannedRights = new raw.types.ChatBannedRights(
    0,
    undefined,
    !(permissions.canSendMessages ?? true),
    !(permissions.canSendMediaMessages ?? true),
    undefined,
    undefined,
    undefined,
    undefined,
    !(permissions.canAddWebPagePreviews ?? true),
    !(permissions.canSendPolls ?? true),
    !(permissions.canChangeInfo ?? true),
    !(permissions.canInviteUsers ?? true),
    !(permissions.canPinMessages ?? true),
    !(permissions.canManageTopics ?? true)
  )

  // messages.EditChatDefaultBannedRights works for both chat and channel
  await this.invoke(
    new raw.functions.messages.EditChatDefaultBannedRights(peer, bannedRights)
  )
  return true
}

/**
 * Enable or disable protected content (no forwarding/saving) in a chat.
 */
export async function setChatProtectedContent(
  this: Client,
  chatId: PeerLike,
  enabled: boolean
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  await this.invoke(new raw.functions.messages.ToggleNoForwards(peer, enabled))
  return true
}

/**
 * Set the slow mode interval (in seconds) for a supergroup.
 */
export async function setSlowMode(
  this: Client,
  chatId: PeerLike,
  seconds: number
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('setSlowMode: only supported for channels/supergroups')
  }
  await this.invoke(
    new raw.functions.channels.ToggleSlowMode(peerToInputChannel(peer), seconds)
  )
  return true
}

/**
 * Set the administrator title (custom admin badge) for a user in a channel.
 */
export async function setAdministratorTitle(
  this: Client,
  chatId: PeerLike,
  userId: PeerLike,
  title: string
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const userPeer = await this.peerResolver.resolvePeer(userId)

  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('setAdministratorTitle: only supported for channels/supergroups')
  }

  const channel = peerToInputChannel(peer)
  const user = peerToInputUser(userPeer)

  // Get current participant rights first
  let currentRights = new raw.types.ChatAdminRights(
    true, false, false, true, false, true, false, false, false, false, true
  )
  try {
    const res = (await this.invoke(
      new raw.functions.channels.GetParticipant(channel, userPeer)
    )) as any
    if (res?.participant?.admin_rights) {
      currentRights = res.participant.admin_rights
    }
  } catch { /* use defaults */ }

  await this.invoke(
    new raw.functions.channels.EditAdmin(channel, user, currentRights, title)
  )
  return true
}

/**
 * Set the "send as" chat for a specific chat.
 */
export async function setSendAsChat(
  this: Client,
  chatId: PeerLike,
  sendAs: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const sendAsPeer = await this.peerResolver.resolvePeer(sendAs)
  await this.invoke(new raw.functions.messages.SaveDefaultSendAs(peer, sendAsPeer))
  return true
}

/**
 * Get the list of "send as" chats available in a chat.
 */
export async function getSendAsChats(
  this: Client,
  chatId: PeerLike
): Promise<any[]> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = (await this.invoke(new raw.functions.channels.GetSendAs(peer))) as any
  return res?.peers ?? []
}

/**
 * Set the discussion group for a channel.
 */
export async function setChatDiscussionGroup(
  this: Client,
  chatId: PeerLike,
  discussionGroupId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const groupPeer = await this.peerResolver.resolvePeer(discussionGroupId)

  const channel = peer instanceof raw.types.InputPeerChannel
    ? peerToInputChannel(peer)
    : new raw.types.InputChannelEmpty() as any
  const group = groupPeer instanceof raw.types.InputPeerChannel
    ? peerToInputChannel(groupPeer)
    : new raw.types.InputChannelEmpty() as any

  await this.invoke(new raw.functions.channels.SetDiscussionGroup(channel, group))
  return true
}

/**
 * Archive one or more chats.
 */
export async function archiveChats(
  this: Client,
  chatIds: PeerLike[]
): Promise<boolean> {
  const peers = await Promise.all(chatIds.map((id) => this.peerResolver.resolvePeer(id)))
  const folderPeers = peers.map(
    (peer) => new raw.types.InputFolderPeer(peer, 1)
  )
  await this.invoke(new raw.functions.folders.EditPeerFolders(folderPeers))
  return true
}

/**
 * Unarchive one or more chats.
 */
export async function unarchiveChats(
  this: Client,
  chatIds: PeerLike[]
): Promise<boolean> {
  const peers = await Promise.all(chatIds.map((id) => this.peerResolver.resolvePeer(id)))
  const folderPeers = peers.map(
    (peer) => new raw.types.InputFolderPeer(peer, 0)
  )
  await this.invoke(new raw.functions.folders.EditPeerFolders(folderPeers))
  return true
}

/**
 * Mark a chat as unread.
 */
export async function markChatUnread(
  this: Client,
  chatId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const dialogPeer = new raw.types.InputDialogPeer(peer)
  await this.invoke(new raw.functions.messages.MarkDialogUnread(dialogPeer, true))
  return true
}

/**
 * Add members to a group chat or channel.
 */
export async function addChatMembers(
  this: Client,
  chatId: PeerLike,
  userIds: PeerLike[],
  options?: { forwardLimit?: number }
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const userPeers = await Promise.all(userIds.map((id) => this.peerResolver.resolvePeer(id)))

  if (peer instanceof raw.types.InputPeerChannel) {
    const users = userPeers.map(peerToInputUser)
    await this.invoke(
      new raw.functions.channels.InviteToChannel(peerToInputChannel(peer), users)
    )
  } else if (peer instanceof raw.types.InputPeerChat) {
    for (const userPeer of userPeers) {
      const user = peerToInputUser(userPeer)
      await this.invoke(
        new raw.functions.messages.AddChatUser(
          peer.chat_id,
          user,
          options?.forwardLimit ?? 100
        )
      )
    }
  } else {
    throw new Error('addChatMembers: unsupported peer type')
  }
  return true
}

/**
 * Delete all messages sent by a specific user in a supergroup.
 */
export async function deleteUserHistory(
  this: Client,
  chatId: PeerLike,
  userId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const userPeer = await this.peerResolver.resolvePeer(userId)

  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('deleteUserHistory: only supported for channels/supergroups')
  }

  await this.invoke(
    new raw.functions.channels.DeleteParticipantHistory(
      peerToInputChannel(peer),
      userPeer
    )
  )
  return true
}

/**
 * Delete a channel permanently.
 */
export async function deleteChannel(
  this: Client,
  chatId: PeerLike
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('deleteChannel: only supported for channels')
  }
  await this.invoke(
    new raw.functions.channels.DeleteChannel(peerToInputChannel(peer))
  )
  return true
}

/**
 * Delete a supergroup permanently.
 */
export async function deleteSupergroup(
  this: Client,
  chatId: PeerLike
): Promise<boolean> {
  return deleteChannel.call(this, chatId)
}

/**
 * Set a username for a channel or supergroup.
 */
export async function setChatUsername(
  this: Client,
  chatId: PeerLike,
  username: string
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('setChatUsername: only supported for channels/supergroups')
  }
  await this.invoke(
    new raw.functions.channels.UpdateUsername(peerToInputChannel(peer), username)
  )
  return true
}

/**
 * Get the number of members online in a chat.
 */
export async function getChatOnlineCount(
  this: Client,
  chatId: PeerLike
): Promise<number> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const res = (await this.invoke(new raw.functions.messages.GetOnlines(peer))) as any
  return res?.onlines ?? 0
}

/**
 * Get the total number of members in a chat.
 */
export async function getChatMembersCount(
  this: Client,
  chatId: PeerLike
): Promise<number> {
  const chat = await this.getChat(chatId)
  return (chat as any)?.membersCount ?? 0
}

/**
 * Enable or disable forum mode (topics) in a supergroup.
 */
export async function toggleForumTopics(
  this: Client,
  chatId: PeerLike,
  enabled: boolean
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('toggleForumTopics: only supported for supergroups')
  }
  await this.invoke(
    new raw.functions.channels.ToggleForum(peerToInputChannel(peer), enabled, false)
  )
  return true
}

/**
 * Toggle whether guests can send messages before joining.
 */
export async function toggleJoinToSend(
  this: Client,
  chatId: PeerLike,
  enabled: boolean
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('toggleJoinToSend: only supported for channels/supergroups')
  }
  await this.invoke(
    new raw.functions.channels.ToggleJoinToSend(peerToInputChannel(peer), enabled)
  )
  return true
}

/**
 * Get the number of dialogs.
 */
export async function getDialogsCount(this: Client): Promise<number> {
  const res = (await this.invoke(
    new raw.functions.messages.GetDialogs(
      0, 0, new raw.types.InputPeerEmpty(), 1, 0n
    )
  )) as any
  return res?.count ?? 0
}

/**
 * Get dialogs (conversations list).
 */
export async function getDialogs(
  this: Client,
  options?: {
    limit?: number
    excludePinned?: boolean
    fromArchive?: boolean
  }
): Promise<any[]> {
  const limit = options?.limit ?? 100
  const res = (await this.invoke(
    new raw.functions.messages.GetDialogs(
      0,
      0,
      new raw.types.InputPeerEmpty(),
      limit,
      0n
    )
  )) as any
  return res?.dialogs ?? []
}

/**
 * Transfer ownership of a channel/supergroup to another user.
 */
export async function transferChatOwnership(
  this: Client,
  chatId: PeerLike,
  userId: PeerLike,
  _password?: string
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const userPeer = await this.peerResolver.resolvePeer(userId)

  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('transferChatOwnership: only supported for channels/supergroups')
  }

  // Note: real ownership transfer requires SRP password challenge
  // This is a stub - full implementation needs account.GetPassword + SRP solve
  throw new Error('transferChatOwnership: requires 2FA password verification - not fully implemented')
}

/**
 * Set a custom tag for a chat member in a channel with tags enabled.
 */
export async function setChatMemberTag(
  this: Client,
  chatId: PeerLike,
  userId: PeerLike,
  tag: string
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const userPeer = await this.peerResolver.resolvePeer(userId)

  if (!(peer instanceof raw.types.InputPeerChannel)) {
    throw new Error('setChatMemberTag: only supported for channels')
  }

  await this.invoke(
    new raw.functions.channels.EditAdmin(
      peerToInputChannel(peer),
      peerToInputUser(userPeer),
      new raw.types.ChatAdminRights(),
      tag
    )
  )
  return true
}

/**
 * Set the TTL (auto-delete timer) for messages in a chat.
 */
export async function setChatTtl(
  this: Client,
  chatId: PeerLike,
  ttlSeconds: number
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  await this.invoke(new raw.functions.messages.SetHistoryTTL(peer, ttlSeconds))
  return true
}

/**
 * Set accent color for a chat or self profile.
 */
export async function setChatAccentColor(
  this: Client,
  chatId: PeerLike,
  accentColorId?: number,
  backgroundCustomEmojiId?: bigint
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  if (peer instanceof raw.types.InputPeerSelf) {
    await this.invoke(
      new raw.functions.account.UpdateColor(
        false,
        new raw.types.PeerColor(accentColorId ?? 0, backgroundCustomEmojiId)
      )
    )
  } else if (peer instanceof raw.types.InputPeerChannel) {
    await this.invoke(
      new raw.functions.channels.UpdateColor(
        peerToInputChannel(peer),
        false,
        accentColorId,
        backgroundCustomEmojiId
      )
    )
  }
  return true
}

/**
 * Set profile accent color for a chat or self profile.
 */
export async function setChatProfileAccentColor(
  this: Client,
  chatId: PeerLike,
  profileAccentColorId?: number,
  profileBackgroundCustomEmojiId?: bigint
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  if (peer instanceof raw.types.InputPeerSelf) {
    await this.invoke(
      new raw.functions.account.UpdateColor(
        true,
        new raw.types.PeerColor(profileAccentColorId ?? 0, profileBackgroundCustomEmojiId)
      )
    )
  } else if (peer instanceof raw.types.InputPeerChannel) {
    await this.invoke(
      new raw.functions.channels.UpdateColor(
        peerToInputChannel(peer),
        true,
        profileAccentColorId,
        profileBackgroundCustomEmojiId
      )
    )
  }
  return true
}
