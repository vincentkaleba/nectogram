//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import { Handler } from './Handler.js'
import { Filter } from '../../filters.js'

export class ChatMemberUpdatedHandler extends Handler {
  constructor(callback: (client: any, chatMemberUpdated: any) => any, filter?: Filter) {
    super(callback, filter)
  }
}

export class ChatJoinRequestHandler extends Handler {
  constructor(callback: (client: any, chatJoinRequest: any) => any, filter?: Filter) {
    super(callback, filter)
  }
}
