//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import { Handler } from './Handler.js'
import { Filter } from '../../filters.js'

export class InlineQueryHandler extends Handler {
  constructor(callback: (client: any, inlineQuery: any) => any, filter?: Filter) {
    super(callback, filter)
  }
}

export class ChosenInlineResultHandler extends Handler {
  constructor(callback: (client: any, chosenInlineResult: any) => any, filter?: Filter) {
    super(callback, filter)
  }
}
