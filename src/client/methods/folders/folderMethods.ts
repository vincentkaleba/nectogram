//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'

const CHATLIST_INVITE_RE = /(?:https?:\/\/)?(?:t\.me|telegram\.me)\/(?:addlist)\/([a-zA-Z0-9_-]+)/

export async function checkChatFolderInviteLink(
  this: Client,
  inviteLink: string
): Promise<any> {
  const match = inviteLink.match(CHATLIST_INVITE_RE)
  const slug = match ? match[1] : inviteLink

  const res = await this.invoke(
    new raw.functions.chatlists.CheckChatlistInvite(
      slug
    )
  )

  return res
}

