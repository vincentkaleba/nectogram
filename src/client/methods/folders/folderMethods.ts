//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'

export async function checkChatFolderInviteLink(
  this: Client,
  inviteLink: string
): Promise<any> {
  const res = await this.invoke(
    new raw.functions.chatlists.CheckChatlistInvite(
      inviteLink
    )
  )

  return res
}
