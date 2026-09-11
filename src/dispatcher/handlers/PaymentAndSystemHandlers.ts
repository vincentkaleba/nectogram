//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import { Handler } from './Handler.js'
import { Filter } from '../../filters.js'

export class PreCheckoutQueryHandler extends Handler {
  constructor(callback: (client: any, query: any) => any, filter?: Filter) {
    super(callback, filter)
  }
}

export class ShippingQueryHandler extends Handler {
  constructor(callback: (client: any, query: any) => any, filter?: Filter) {
    super(callback, filter)
  }
}

export class UserStatusHandler extends Handler {
  constructor(callback: (client: any, userStatus: any) => any, filter?: Filter) {
    super(callback, filter)
  }
}

export class DeletedMessagesHandler extends Handler {
  constructor(callback: (client: any, deletedMessages: any) => any, filter?: Filter) {
    super(callback, filter)
  }
}

export class ConnectHandler extends Handler {
  constructor(callback: (client: any) => any) {
    super(callback)
  }
}

export class DisconnectHandler extends Handler {
  constructor(callback: (client: any) => any) {
    super(callback)
  }
}
