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

import { RPCError, splitErrorMessage } from './RPCError.js'
import * as rpc from './rpc/index.js'

export { RPCError, splitErrorMessage } from './RPCError.js'
export { SecurityCheckMismatch } from './SecurityCheckMismatch.js'
export { TransportError, AuthKeyNotFound, TransportFlood } from './TransportErrors.js'
export * from './rpc/index.js'

const ERROR_REGISTRY: Record<string, new (val: any, rpcName: string | null, isSigned: boolean) => RPCError> = {
  'FLOOD_WAIT_X': rpc.FloodWait,
  'PHONE_CODE_INVALID': rpc.PhoneCodeInvalid,
  'SESSION_PASSWORD_NEEDED': rpc.SessionPasswordNeeded,
  'AUTH_KEY_UNREGISTERED': rpc.AuthKeyUnregistered,
}

const CATEGORY_REGISTRY: Record<number, new (val: any, rpcName: string | null, isSigned: boolean) => RPCError> = {
  303: rpc.SeeOther,
  400: rpc.BadRequest,
  401: rpc.Unauthorized,
  403: rpc.Forbidden,
  404: rpc.NotFound,
  420: rpc.Flood,
  500: rpc.InternalServerError,
}

export function raise_it(code: number, message: string, rpcName: string | null = null): never {
  const isSigned = code < 0
  const absCode = Math.abs(code)

  const parts = splitErrorMessage(message)

  if (parts.errorId in ERROR_REGISTRY) {
    const Ctor = ERROR_REGISTRY[parts.errorId]
    throw new Ctor(parts.value, rpcName, isSigned)
  }

  if (absCode in CATEGORY_REGISTRY) {
    const CategoryCtor = CATEGORY_REGISTRY[absCode]
    throw new CategoryCtor(message, rpcName, isSigned)
  }

  throw new RPCError(message, rpcName, isSigned, absCode, 'UNKNOWN_ERROR')
}
