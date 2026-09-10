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

import { Client, raw } from '../src/index.js'

async function main() {
  console.log('📡 Low-Level MTProto Invocation Demo...')

  const client = new Client({
    apiId: Number(process.env.API_ID || 123456),
    apiHash: process.env.API_HASH || '0123456789abcdef0123456789abcdef',
    inMemory: true,
  })

  // Example 1: Invoking raw help.GetConfig
  try {
    const config = await client.invoke<raw.types.Config>(new raw.functions.help.GetConfig())
    console.log(`Connected DC: ${config.this_dc}, Max Members: ${config.chat_size_max}`)
  } catch {
    console.log('ℹ️ Invoke raw query syntax demonstration.')
  }

  // Example 2: Resolving a public username via contacts.ResolveUsername
  try {
    const resolved = await client.invoke<raw.types.contacts.ResolvedPeer>(
      new raw.functions.contacts.ResolveUsername('telegram')
    )
    console.log(`Resolved Peer ID:`, resolved.peer)
  } catch {
    console.log('ℹ️ Resolving peer syntax demonstration.')
  }
}

main().catch(console.error)
