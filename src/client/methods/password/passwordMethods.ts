//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'

export async function enableCloudPassword(
  this: Client,
  password: string,
  hint: string = ''
): Promise<boolean> {
  const pwdState = await this.invoke(new raw.functions.account.GetPassword())
  const algo = pwdState.current_algo

  if (!algo) {
    throw new Error('enableCloudPassword: Current password algorithm not returned by server')
  }

  await this.invoke(
    new raw.functions.account.UpdatePasswordSettings(
      new raw.types.InputCheckPasswordEmpty(),
      new raw.types.account.PasswordInputSettings(
        algo as any,
        Buffer.from([]),
        hint
      )
    )
  )

  return true
}

export async function changeCloudPassword(
  this: Client,
  currentPassword: string,
  newPassword: string,
  hint: string = ''
): Promise<boolean> {
  const pwdState = await this.invoke(new raw.functions.account.GetPassword())

  await this.invoke(
    new raw.functions.account.UpdatePasswordSettings(
      new raw.types.InputCheckPasswordEmpty(),
      new raw.types.account.PasswordInputSettings(
        pwdState.current_algo as any,
        Buffer.from([]),
        hint
      )
    )
  )

  return true
}

export async function removeCloudPassword(
  this: Client,
  currentPassword: string
): Promise<boolean> {
  await this.invoke(
    new raw.functions.account.UpdatePasswordSettings(
      new raw.types.InputCheckPasswordEmpty(),
      new raw.types.account.PasswordInputSettings(
        undefined,
        undefined,
        ''
      )
    )
  )

  return true
}
