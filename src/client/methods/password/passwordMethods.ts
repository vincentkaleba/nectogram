//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'

export async function enableCloudPassword(
  this: Client,
  password: string,
  hint: string = '',
  email?: string
): Promise<boolean> {
  const pwdState = (await this.invoke(new raw.functions.account.GetPassword())) as any
  if (pwdState.has_password) {
    throw new Error('There is already a cloud password enabled')
  }

  await this.invoke(
    new raw.functions.account.UpdatePasswordSettings(
      new raw.types.InputCheckPasswordEmpty(),
      new raw.types.account.PasswordInputSettings(
        pwdState.new_algo ?? new raw.types.PasswordKdfAlgoUnknown(),
        Buffer.from([]),
        hint,
        email
      )
    )
  )

  return true
}

export async function changeCloudPassword(
  this: Client,
  currentPassword: string,
  newPassword: string,
  newHint: string = ''
): Promise<boolean> {
  const pwdState = (await this.invoke(new raw.functions.account.GetPassword())) as any
  if (!pwdState.has_password) {
    throw new Error('There is no cloud password to change')
  }

  await this.invoke(
    new raw.functions.account.UpdatePasswordSettings(
      new raw.types.InputCheckPasswordEmpty(),
      new raw.types.account.PasswordInputSettings(
        pwdState.new_algo ?? new raw.types.PasswordKdfAlgoUnknown(),
        Buffer.from([]),
        newHint
      )
    )
  )

  return true
}

export async function removeCloudPassword(
  this: Client,
  password: string
): Promise<boolean> {
  const pwdState = (await this.invoke(new raw.functions.account.GetPassword())) as any
  if (!pwdState.has_password) {
    throw new Error('There is no cloud password to remove')
  }

  await this.invoke(
    new raw.functions.account.UpdatePasswordSettings(
      new raw.types.InputCheckPasswordEmpty(),
      new raw.types.account.PasswordInputSettings(
        new raw.types.PasswordKdfAlgoUnknown(),
        Buffer.from([]),
        ''
      )
    )
  )

  return true
}

