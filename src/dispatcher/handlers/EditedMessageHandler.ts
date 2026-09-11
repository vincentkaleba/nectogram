//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import { Handler } from './Handler.js'
import { Filter } from '../../filters.js'
import { Message } from '../../types/index.js'

export class EditedMessageHandler extends Handler<Message> {
  constructor(callback: (client: any, message: Message) => any, filter?: Filter) {
    super(callback, filter)
  }
}
