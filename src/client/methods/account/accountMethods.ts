//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { User } from '../../../types/index.js'

export async function updateProfile(
  this: Client,
  options?: { firstName?: string; lastName?: string; about?: string }
): Promise<User> {
  const res = await this.invoke(
    new raw.functions.account.UpdateProfile(
      options?.firstName,
      options?.lastName,
      options?.about
    )
  )

  return User._parse(res as any)
}

export async function setUsername(
  this: Client,
  username: string
): Promise<User> {
  const res = await this.invoke(
    new raw.functions.account.UpdateUsername(
      username
    )
  )

  return User._parse(res as any)
}

export async function getAccountTtl(
  this: Client
): Promise<number> {
  const res = await this.invoke(
    new raw.functions.account.GetAccountTTL()
  )

  return res.days
}

export async function setAccountTtl(
  this: Client,
  days: number
): Promise<boolean> {
  await this.invoke(
    new raw.functions.account.SetAccountTTL(
      new raw.types.AccountDaysTTL(days)
    )
  )

  return true
}

export async function getPrivacy(
  this: Client,
  key: any
): Promise<any> {
  const res = await this.invoke(
    new raw.functions.account.GetPrivacy(
      key
    )
  )

  return res
}

export async function setPrivacy(
  this: Client,
  key: any,
  rules: any[]
): Promise<any> {
  const res = await this.invoke(
    new raw.functions.account.SetPrivacy(
      key,
      rules
    )
  )

  return res
}
