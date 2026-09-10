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

export async function signInBot(this: Client, botToken: string): Promise<User> {
  const authRes = await this.invoke(
    new raw.functions.auth.ImportBotAuthorization(
      0, // flags
      this.apiId,
      this.apiHash,
      botToken
    )
  )

  if (authRes && authRes.user && authRes.user instanceof raw.types.User) {
    const user = User._parse(authRes.user)
    this.me = user
    await this.storage.setUserId(user.id)
    await this.storage.setIsBot(true)
    await this.storage.updatePeer({
      id: user.id,
      accessHash: authRes.user.access_hash ?? 0n,
      type: 'user',
      username: user.username,
      phone: user.phone,
    })
    return user
  }

  return await this.getMe()
}
