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

export interface UserOptions {
  id: bigint
  isSelf?: boolean
  isBot?: boolean
  isDeleted?: boolean
  firstName?: string
  lastName?: string
  username?: string
  phone?: string
  languageCode?: string
  dcId?: number
  raw?: raw.types.User
}

/**
 * High-level representation of a Telegram user or bot.
 */
export class User {
  public readonly id: bigint
  public readonly isSelf: boolean
  public readonly isBot: boolean
  public readonly isDeleted: boolean
  public readonly firstName?: string
  public readonly lastName?: string
  public readonly username?: string
  public readonly phone?: string
  public readonly languageCode?: string
  public readonly dcId?: number
  public readonly raw?: raw.types.User

  constructor(options: UserOptions) {
    this.id = options.id
    this.isSelf = options.isSelf ?? false
    this.isBot = options.isBot ?? false
    this.isDeleted = options.isDeleted ?? false
    this.firstName = options.firstName
    this.lastName = options.lastName
    this.username = options.username
    this.phone = options.phone
    this.languageCode = options.languageCode
    this.dcId = options.dcId
    this.raw = options.raw
  }

  public get fullName(): string | undefined {
    const parts = [this.firstName, this.lastName].filter(Boolean)
    if (parts.length > 0) return parts.join(' ')
    if (this.username) return `@${this.username}`
    return undefined
  }

  /**
   * Parse a raw TL User object into a high-level User instance.
   */
  public static _parse(rawUser: raw.types.User): User {
    return new User({
      id: rawUser.id,
      isSelf: rawUser.isSelf ?? false,
      isBot: rawUser.bot ?? false,
      isDeleted: rawUser.deleted ?? false,
      firstName: rawUser.first_name,
      lastName: rawUser.last_name,
      username: rawUser.username ?? (rawUser.usernames && rawUser.usernames.length > 0 ? rawUser.usernames[0].username : undefined),
      phone: rawUser.phone,
      languageCode: rawUser.lang_code,
      dcId: rawUser.photo && 'dc_id' in rawUser.photo ? (rawUser.photo as any).dc_id : undefined,
      raw: rawUser,
    })
  }
}
