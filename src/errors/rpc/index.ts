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

import { RPCError } from '../RPCError.js'

export class SeeOther extends RPCError {
  static override CODE = 303
  static override NAME = 'SEE_OTHER'
}

export class BadRequest extends RPCError {
  static override CODE = 400
  static override NAME = 'BAD_REQUEST'
}

export class Unauthorized extends RPCError {
  static override CODE = 401
  static override NAME = 'UNAUTHORIZED'
}

export class Forbidden extends RPCError {
  static override CODE = 403
  static override NAME = 'FORBIDDEN'
}

export class NotFound extends RPCError {
  static override CODE = 404
  static override NAME = 'NOT_FOUND'
}

export class Flood extends RPCError {
  static override CODE = 420
  static override NAME = 'FLOOD'
}

export class InternalServerError extends RPCError {
  static override CODE = 500
  static override NAME = 'INTERNAL_SERVER_ERROR'
}

// Known specialized errors
export class FloodWait extends Flood {
  static override ID = 'FLOOD_WAIT_X'
  static override MESSAGE = 'A wait of {value} seconds is required'
  static VALUE_NAME = 'seconds'
}

export class PhoneCodeInvalid extends BadRequest {
  static override ID = 'PHONE_CODE_INVALID'
  static override MESSAGE = 'The confirmation code is invalid'
}

export class SessionPasswordNeeded extends Unauthorized {
  static override ID = 'SESSION_PASSWORD_NEEDED'
  static override MESSAGE = 'Two-step verification is enabled and a password is required'
}

export class AuthKeyUnregistered extends Unauthorized {
  static override ID = 'AUTH_KEY_UNREGISTERED'
  static override MESSAGE = 'The key is not registered on the server'
}
