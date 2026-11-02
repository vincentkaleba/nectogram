//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../raw/index.js'

export interface ReplyKeyboardRemoveOptions {
  selective?: boolean
}

export class ReplyKeyboardRemove {
  public readonly removeKeyboard: boolean = true
  public readonly selective?: boolean

  constructor(options?: ReplyKeyboardRemoveOptions | boolean) {
    if (typeof options === 'boolean') {
      this.selective = options
    } else if (options) {
      this.selective = options.selective
    }
  }

  public get remove_keyboard(): boolean {
    return true
  }

  public toRaw(): raw.types.ReplyKeyboardHide {
    return new raw.types.ReplyKeyboardHide(this.selective)
  }
}
