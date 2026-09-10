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

import { describe, it, expect } from 'vitest'
import {
  splitErrorMessage,
  RPCError,
  raise_it,
  FloodWait,
  PhoneCodeInvalid,
  BadRequest,
  SecurityCheckMismatch,
  TransportError,
  AuthKeyNotFound
} from '../src/errors/index.js'

describe('RPC Errors & Helper Functions', () => {
  describe('splitErrorMessage', () => {
    it('splits simple error messages with numeric suffix', () => {
      const res = splitErrorMessage('FLOOD_WAIT_15')
      expect(res).toEqual({ errorId: 'FLOOD_WAIT_X', value: 15 })
    })

    it('splits error messages without numeric suffix', () => {
      const res = splitErrorMessage('PHONE_CODE_INVALID')
      expect(res).toEqual({ errorId: 'PHONE_CODE_INVALID', value: null })
    })

    it('splits string parameter prefixes', () => {
      const res = splitErrorMessage('APNS_VERIFY_CHECK_TOKEN123')
      expect(res).toEqual({ errorId: 'APNS_VERIFY_CHECK_X', value: 'TOKEN123' })
    })
  })

  describe('raise_it factory', () => {
    it('throws FloodWait for FLOOD_WAIT_30', () => {
      try {
        raise_it(420, 'FLOOD_WAIT_30', 'auth.sendCode')
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(FloodWait)
        const floodErr = err as FloodWait
        expect(floodErr.code).toBe(420)
        expect(floodErr.value).toBe(30)
        expect(floodErr.rpcName).toBe('auth.sendCode')
      }
    })

    it('throws PhoneCodeInvalid for PHONE_CODE_INVALID', () => {
      try {
        raise_it(400, 'PHONE_CODE_INVALID')
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(PhoneCodeInvalid)
        const phoneErr = err as PhoneCodeInvalid
        expect(phoneErr.code).toBe(400)
      }
    })

    it('throws category BadRequest for unknown 400 error', () => {
      try {
        raise_it(400, 'SOME_UNKNOWN_BAD_REQUEST')
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequest)
        const brErr = err as BadRequest
        expect(brErr.code).toBe(400)
        expect(brErr.message).toContain('SOME_UNKNOWN_BAD_REQUEST')
      }
    })

    it('handles negative error codes (signed)', () => {
      try {
        raise_it(-400, 'PHONE_CODE_INVALID')
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(PhoneCodeInvalid)
        const phoneErr = err as PhoneCodeInvalid
        expect(phoneErr.code).toBe(-400)
      }
    })

    it('throws generic RPCError for unknown code and error message', () => {
      try {
        raise_it(999, 'UNKNOWN_SOMETHING_999')
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(RPCError)
        const rpcErr = err as RPCError
        expect(rpcErr.code).toBe(999)
      }
    })
  })

  describe('Security & Transport Errors', () => {
    it('creates SecurityCheckMismatch with reason', () => {
      const secErr = new SecurityCheckMismatch('Nonce mismatch')
      expect(secErr.message).toBe('Security check failed: Nonce mismatch')
      expect(secErr).toBeInstanceOf(Error)
    })

    it('creates TransportError and derived transport errors', () => {
      const authErr = new AuthKeyNotFound()
      expect(authErr).toBeInstanceOf(TransportError)
      expect(authErr.code).toBe(-404)
      expect(authErr.message).toContain('-404')
    })
  })
})
