//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../raw/index.js'

export interface ForceReplyOptions {
  selective?: boolean
  inputFieldPlaceholder?: string
}

export class ForceReply {
  public readonly forceReply: boolean = true
  public readonly selective?: boolean
  public readonly inputFieldPlaceholder?: string

  constructor(options?: ForceReplyOptions | boolean) {
    if (typeof options === 'boolean') {
      this.selective = options
    } else if (options) {
      this.selective = options.selective
      this.inputFieldPlaceholder = options.inputFieldPlaceholder
    }
  }

  public get force_reply(): boolean {
    return true
  }

  public get input_field_placeholder(): string | undefined {
    return this.inputFieldPlaceholder
  }

  public toRaw(): raw.types.ReplyKeyboardForceReply {
    return new raw.types.ReplyKeyboardForceReply(
      undefined,
      this.selective,
      this.inputFieldPlaceholder
    )
  }
}
