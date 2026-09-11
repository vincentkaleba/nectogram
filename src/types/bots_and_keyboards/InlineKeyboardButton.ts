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

export type ButtonStyleOption =
  | 'primary'
  | 'danger'
  | 'success'
  | { bgPrimary?: boolean; bgDanger?: boolean; bgSuccess?: boolean; icon?: bigint }

export interface InlineKeyboardButtonOptions {
  text: string
  callbackData?: string
  url?: string
  copyText?: string
  webAppUrl?: string
  switchInlineQuery?: string
  buy?: boolean
  userProfileId?: bigint
  style?: ButtonStyleOption
}

export class InlineKeyboardButton {
  public readonly text: string
  public readonly callbackData?: string
  public readonly url?: string
  public readonly copyText?: string
  public readonly webAppUrl?: string
  public readonly switchInlineQuery?: string
  public readonly buy?: boolean
  public readonly userProfileId?: bigint
  public readonly style?: ButtonStyleOption

  constructor(options: InlineKeyboardButtonOptions) {
    this.text = options.text
    this.callbackData = options.callbackData
    this.url = options.url
    this.copyText = options.copyText
    this.webAppUrl = options.webAppUrl
    this.switchInlineQuery = options.switchInlineQuery
    this.buy = options.buy
    this.userProfileId = options.userProfileId
    this.style = options.style
  }

  public writeTL(): raw.types.KeyboardInlineButton {
    let buttonType: raw.base.InlineButtonType

    if (this.url) {
      buttonType = new raw.types.InlineButtonTypeUrl(this.url)
    } else if (this.copyText) {
      buttonType = new raw.types.InlineButtonTypeCopy(this.copyText)
    } else if (this.webAppUrl) {
      buttonType = new raw.types.InlineButtonTypeWebView(this.webAppUrl)
    } else if (this.switchInlineQuery !== undefined) {
      buttonType = new raw.types.InlineButtonTypeSwitchInline(this.switchInlineQuery, false)
    } else if (this.buy) {
      buttonType = new raw.types.InlineButtonTypeBuy()
    } else if (this.userProfileId !== undefined) {
      buttonType = new raw.types.InlineButtonTypeUserProfile(this.userProfileId)
    } else if (this.callbackData) {
      buttonType = new raw.types.InlineButtonTypeCallback(Buffer.from(this.callbackData, 'utf8'))
    } else {
      buttonType = new raw.types.InlineButtonTypeCallback(Buffer.alloc(0))
    }

    let buttonStyle: raw.types.KeyboardButtonStyle | undefined
    if (this.style) {
      if (this.style === 'primary') {
        buttonStyle = new raw.types.KeyboardButtonStyle(true, false, false, undefined)
      } else if (this.style === 'danger') {
        buttonStyle = new raw.types.KeyboardButtonStyle(false, true, false, undefined)
      } else if (this.style === 'success') {
        buttonStyle = new raw.types.KeyboardButtonStyle(false, false, true, undefined)
      } else if (typeof this.style === 'object') {
        buttonStyle = new raw.types.KeyboardButtonStyle(
          this.style.bgPrimary,
          this.style.bgDanger,
          this.style.bgSuccess,
          this.style.icon
        )
      }
    }

    return new raw.types.KeyboardInlineButton(this.text, buttonType, buttonStyle)
  }
}
