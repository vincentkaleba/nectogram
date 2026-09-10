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

export interface MessageParts {
  errorId: string
  value: number | string | null
}

const STRING_PARAMETER_PREFIXES = [
  'APNS_VERIFY_CHECK_',
  'INTEGRITY_CHECK_CLASSIC_',
  'RECAPTCHA_CHECK_',
]

const PARAMETER_RE = /_(\d+)/

export function splitErrorMessage(errorMessage: string): MessageParts {
  for (const prefix of STRING_PARAMETER_PREFIXES) {
    if (errorMessage.startsWith(prefix)) {
      return {
        errorId: `${prefix}X`,
        value: errorMessage.slice(prefix.length),
      }
    }
  }

  const match = PARAMETER_RE.exec(errorMessage)
  if (!match) {
    return { errorId: errorMessage, value: null }
  }

  const errorId = errorMessage.replace(/_\d+/g, '_X')
  const numVal = parseInt(match[1], 10)
  return {
    errorId,
    value: isNaN(numVal) ? match[1] : numVal,
  }
}

export class RPCError extends Error {
  static ID: string | null = null
  static CODE: number | null = null
  static NAME: string | null = null
  static MESSAGE: string = '{value}'

  readonly code: number
  readonly id: string
  readonly value: number | string | null
  readonly rpcName: string | null

  constructor(
    value: number | string | null = null,
    rpcName: string | null = null,
    isSigned = false,
    codeOverride?: number,
    idOverride?: string
  ) {
    const rawCode = codeOverride ?? (new.target as any).CODE ?? 500
    const code = isSigned ? -rawCode : rawCode
    const id = idOverride ?? (new.target as any).ID ?? (new.target as any).NAME ?? 'RPC_ERROR'
    const template = (new.target as any).MESSAGE ?? '{value}'
    const description = template.replace('{value}', String(value ?? ''))
    const causedBy = rpcName ? ` (caused by "${rpcName}")` : ''
    const message = `Telegram says: [${code} ${id}] - ${description}${causedBy}`

    super(message)
    this.name = this.constructor.name
    this.code = code
    this.id = id
    this.value = value
    this.rpcName = rpcName
  }
}
