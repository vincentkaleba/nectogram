import { describe, it, expect } from 'vitest'
import { Client } from '../src/client/Client.js'

describe('Phase 2 Methods Test Suite', () => {
  it('should expose all Phase 2 Auth, Account, InviteLinks & Contacts methods on Client.prototype', () => {
    const client = new Client({ apiId: 12345, apiHash: 'test_hash', inMemory: true })

    expect(typeof client.sendCode).toBe('function')
    expect(typeof client.resendCode).toBe('function')
    expect(typeof client.signIn).toBe('function')
    expect(typeof client.signUp).toBe('function')
    expect(typeof client.logOut).toBe('function')
    expect(typeof client.acceptTermsOfService).toBe('function')
    expect(typeof client.updateProfile).toBe('function')
    expect(typeof client.setUsername).toBe('function')
    expect(typeof client.getAccountTtl).toBe('function')
    expect(typeof client.setAccountTtl).toBe('function')
    expect(typeof client.getPrivacy).toBe('function')
    expect(typeof client.setPrivacy).toBe('function')
    expect(typeof client.createChatInviteLink).toBe('function')
    expect(typeof client.editChatInviteLink).toBe('function')
    expect(typeof client.revokeChatInviteLink).toBe('function')
    expect(typeof client.deleteChatInviteLink).toBe('function')
    expect(typeof client.approveChatJoinRequest).toBe('function')
    expect(typeof client.declineChatJoinRequest).toBe('function')
    expect(typeof client.addContact).toBe('function')
    expect(typeof client.deleteContacts).toBe('function')
    expect(typeof client.getContacts).toBe('function')
    expect(typeof client.searchContacts).toBe('function')
  })
})
