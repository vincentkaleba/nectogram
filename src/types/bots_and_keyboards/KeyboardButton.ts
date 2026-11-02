//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../raw/index.js'

export interface KeyboardButtonOptions {
  text: string
  requestContact?: boolean
  requestLocation?: boolean
  requestPoll?: boolean
  requestUsers?: boolean
  requestChat?: boolean
  webApp?: { url: string }
}

export class KeyboardButton {
  public readonly text: string
  public readonly requestContact?: boolean
  public readonly requestLocation?: boolean
  public readonly requestPoll?: boolean
  public readonly requestUsers?: boolean
  public readonly requestChat?: boolean
  public readonly webApp?: { url: string }

  constructor(options: KeyboardButtonOptions | string) {
    if (typeof options === 'string') {
      this.text = options
    } else {
      this.text = options.text
      this.requestContact = options.requestContact
      this.requestLocation = options.requestLocation
      this.requestPoll = options.requestPoll
      this.requestUsers = options.requestUsers
      this.requestChat = options.requestChat
      this.webApp = options.webApp
    }
  }

  public toRaw(): raw.types.KeyboardButton {
    let btnType: any = new raw.types.ButtonTypeDefault()
    if (this.requestContact) {
      btnType = new raw.types.ButtonTypeRequestPhone()
    } else if (this.requestLocation) {
      btnType = new raw.types.ButtonTypeRequestGeoLocation()
    } else if (this.webApp) {
      btnType = new raw.types.ButtonTypeSimpleWebView(this.webApp.url)
    }
    return new raw.types.KeyboardButton(this.text, btnType)
  }
}
