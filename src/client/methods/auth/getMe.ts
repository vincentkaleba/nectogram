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

import * as raw from '../../../raw/index.js'
import { User } from '../../../types/index.js'
import type { Client } from '../../Client.js'

export async function getMe(this: Client): Promise<User> {
  const res = await this.invoke(
    new raw.functions.users.GetUsers([new raw.types.InputUserSelf()])
  )

  if (Array.isArray(res) && res.length > 0) {
    const rawUser = res[0]
    if (rawUser instanceof raw.types.User) {
      const user = User._parse(rawUser)
      this.me = user
      await this.storage.setUserId(user.id)
      await this.storage.setIsBot(user.isBot ?? false)
      await this.storage.updatePeer({
        id: user.id,
        accessHash: rawUser.access_hash ?? 0n,
        type: 'user',
        username: user.username,
        phone: user.phone,
      })
      return user
    }
  }

  throw new Error('getMe: Failed to fetch current user information')
}
