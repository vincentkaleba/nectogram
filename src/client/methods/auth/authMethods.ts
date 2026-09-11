//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { User } from '../../../types/index.js'

export async function sendCode(
  this: Client,
  phoneNumber: string
): Promise<raw.types.auth.SentCode> {
  const res = await this.invoke(
    new raw.functions.auth.SendCode(
      phoneNumber,
      this.apiId,
      this.apiHash,
      new raw.types.CodeSettings()
    )
  )

  return res as raw.types.auth.SentCode
}

export async function resendCode(
  this: Client,
  phoneNumber: string,
  phoneCodeHash: string
): Promise<raw.types.auth.SentCode> {
  const res = await this.invoke(
    new raw.functions.auth.ResendCode(
      phoneNumber,
      phoneCodeHash
    )
  )

  return res as raw.types.auth.SentCode
}

export async function signIn(
  this: Client,
  phoneNumber: string,
  phoneCodeHash: string,
  phoneCode: string
): Promise<User> {
  const res = await this.invoke(
    new raw.functions.auth.SignIn(
      phoneNumber,
      phoneCodeHash,
      phoneCode
    )
  )

  if ('user' in res) {
    return User._parse((res as any).user)
  }

  throw new Error('signIn: Failed to authenticate user')
}

export async function signUp(
  this: Client,
  phoneNumber: string,
  phoneCodeHash: string,
  firstName: string,
  lastName: string = ''
): Promise<User> {
  const res = await this.invoke(
    new raw.functions.auth.SignUp(
      phoneNumber,
      phoneCodeHash,
      firstName,
      lastName
    )
  )

  if ('user' in res) {
    return User._parse((res as any).user)
  }

  throw new Error('signUp: Failed to register user')
}

export async function logOut(
  this: Client
): Promise<boolean> {
  await this.invoke(
    new raw.functions.auth.LogOut()
  )

  await this.storage.setAuthKey(null)
  return true
}

export async function acceptTermsOfService(
  this: Client,
  termsOfServiceId: string
): Promise<boolean> {
  await this.invoke(
    new raw.functions.help.AcceptTermsOfService(
      new raw.types.DataJSON(termsOfServiceId)
    )
  )

  return true
}

export async function changePhoneNumber(
  this: Client,
  phoneNumber: string,
  phoneCodeHash: string,
  phoneCode: string
): Promise<User> {
  const res = await this.invoke(
    new raw.functions.account.ChangePhone(
      phoneNumber.replace(/\D/g, ''),
      phoneCodeHash,
      phoneCode
    )
  )

  return User._parse(res as any)
}

export async function getActiveSessions(
  this: Client
): Promise<any> {
  const res = await this.invoke(
    new raw.functions.account.GetAuthorizations()
  )

  return res
}

export async function resetSession(
  this: Client,
  sessionHash: bigint
): Promise<boolean> {
  const res = await this.invoke(
    new raw.functions.account.ResetAuthorization(sessionHash)
  )

  return Boolean(res)
}

export async function resetSessions(
  this: Client
): Promise<boolean> {
  const res = await this.invoke(
    new raw.functions.auth.ResetAuthorizations()
  )

  return Boolean(res)
}

export const sendPhoneNumberCode = sendCode
export const resendPhoneNumberCode = resendCode
