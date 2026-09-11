//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import { Handler } from './Handler.js'
import { Filter } from '../../filters.js'

export class MessageReactionHandler extends Handler {
  constructor(callback: (client: any, messageReaction: any) => any, filter?: Filter) {
    super(callback, filter)
  }
}

export class MessageReactionCountHandler extends Handler {
  constructor(callback: (client: any, messageReactionCount: any) => any, filter?: Filter) {
    super(callback, filter)
  }
}

export class PollHandler extends Handler {
  constructor(callback: (client: any, poll: any) => any, filter?: Filter) {
    super(callback, filter)
  }
}

export class StoryHandler extends Handler {
  constructor(callback: (client: any, story: any) => any, filter?: Filter) {
    super(callback, filter)
  }
}
