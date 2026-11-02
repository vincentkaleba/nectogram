//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../raw/index.js'
import { KeyboardButton, KeyboardButtonOptions } from './KeyboardButton.js'

export type KeyboardButtonLike = string | KeyboardButtonOptions | KeyboardButton

export interface ReplyKeyboardMarkupOptions {
  keyboard: KeyboardButtonLike[][]
  resizeKeyboard?: boolean
  oneTimeKeyboard?: boolean
  selective?: boolean
  isPersistent?: boolean
  inputFieldPlaceholder?: string
}

export class ReplyKeyboardMarkup {
  public readonly keyboard: KeyboardButton[][]
  public readonly resizeKeyboard?: boolean
  public readonly oneTimeKeyboard?: boolean
  public readonly selective?: boolean
  public readonly isPersistent?: boolean
  public readonly inputFieldPlaceholder?: string

  constructor(keyboardOrOptions: KeyboardButtonLike[][] | ReplyKeyboardMarkupOptions) {
    if (Array.isArray(keyboardOrOptions)) {
      this.keyboard = keyboardOrOptions.map((row) =>
        row.map((btn) => (btn instanceof KeyboardButton ? btn : new KeyboardButton(btn)))
      )
    } else {
      this.keyboard = keyboardOrOptions.keyboard.map((row) =>
        row.map((btn) => (btn instanceof KeyboardButton ? btn : new KeyboardButton(btn)))
      )
      this.resizeKeyboard = keyboardOrOptions.resizeKeyboard
      this.oneTimeKeyboard = keyboardOrOptions.oneTimeKeyboard
      this.selective = keyboardOrOptions.selective
      this.isPersistent = keyboardOrOptions.isPersistent
      this.inputFieldPlaceholder = keyboardOrOptions.inputFieldPlaceholder
    }
  }

  // Pyrogram snake_case aliases
  public get resize_keyboard(): boolean | undefined {
    return this.resizeKeyboard
  }
  public get one_time_keyboard(): boolean | undefined {
    return this.oneTimeKeyboard
  }
  public get input_field_placeholder(): string | undefined {
    return this.inputFieldPlaceholder
  }

  public toRaw(): raw.types.ReplyKeyboardMarkup {
    const rawRows = this.keyboard.map((row) =>
      new raw.types.KeyboardButtonRow(row.map((btn) => btn.toRaw()))
    )
    return new raw.types.ReplyKeyboardMarkup(
      rawRows,
      this.resizeKeyboard,
      this.oneTimeKeyboard,
      this.selective,
      this.isPersistent,
      false, // force_reply
      this.inputFieldPlaceholder
    )
  }
}
