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

export class TransportError extends Error {
  readonly code: number

  constructor(code: number, message: string) {
    super(`Transport error [${code}]: ${message}`)
    this.name = 'TransportError'
    this.code = code
  }
}

export class AuthKeyNotFound extends TransportError {
  constructor() {
    super(-404, 'Auth key not found on server')
  }
}

export class TransportFlood extends TransportError {
  constructor() {
    super(-429, 'Transport flood limit exceeded')
  }
}
