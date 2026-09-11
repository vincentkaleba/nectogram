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

export interface RichMessageOptions {
  markdown?: string
  html?: string
  rtl?: boolean
  noAutoLink?: boolean
}

/**
 * High-level helper class to construct Telegram Rich Messages (TG-13 schema updates).
 */
export class RichMessage {
  public readonly markdown?: string
  public readonly html?: string
  public readonly rtl: boolean
  public readonly noAutoLink: boolean

  constructor(options: RichMessageOptions) {
    this.markdown = options.markdown
    this.html = options.html
    this.rtl = options.rtl ?? false
    this.noAutoLink = options.noAutoLink ?? false
  }

  public writeTL(): raw.base.InputRichMessage {
    if (this.html) {
      return new raw.types.InputRichMessageHTML(this.html, this.rtl, this.noAutoLink)
    }
    return new raw.types.InputRichMessageMarkdown(this.markdown ?? '', this.rtl, this.noAutoLink)
  }
}
