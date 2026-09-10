//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//
//  This file is part of Nectogram.
//
//  Nectogram is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Lesser General Public License as published
//  by the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  Nectogram is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Lesser General Public License for more details.
//
//  You should have received a copy of the GNU Lesser General Public License
//  along with Nectogram.  If not, see <http://www.gnu.org/licenses/>.

import * as raw from '../../raw/index.js'

export interface InlineKeyboardButtonOptions {
  text: string
  callbackData?: string
  url?: string
}

export class InlineKeyboardButton {
  public readonly text: string
  public readonly callbackData?: string
  public readonly url?: string

  constructor(options: InlineKeyboardButtonOptions) {
    this.text = options.text
    this.callbackData = options.callbackData
    this.url = options.url
  }

  public writeTL(): raw.types.KeyboardInlineButton {
    let buttonType: raw.base.InlineButtonType
    if (this.url) {
      buttonType = new raw.types.InlineButtonTypeUrl(this.url)
    } else if (this.callbackData) {
      buttonType = new raw.types.InlineButtonTypeCallback(Buffer.from(this.callbackData, 'utf8'))
    } else {
      buttonType = new raw.types.InlineButtonTypeCallback(Buffer.alloc(0))
    }

    return new raw.types.KeyboardInlineButton(this.text, buttonType)
  }
}
