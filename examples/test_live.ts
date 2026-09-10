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

const API_ID = Number(process.env.API_ID || 123456)
const API_HASH = process.env.API_HASH || '0123456789abcdef0123456789abcdef'
const BOT_TOKEN = process.env.BOT_TOKEN || '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ'

async function main() {
  console.log('📡 Starting Nectogram Live Integration Test with Telegram DC...')

  const bot = new Client({
    name: 'live_test_bot',
    apiId: API_ID,
    apiHash: API_HASH,
    inMemory: true,
  })

  try {
    console.log('1. Connecting socket and establishing session...')
    await bot.connect()
    console.log('✅ Socket connected and MTProto Session started!')

    console.log('2. Authenticating bot via signInBot...')
    const me = await bot.signInBot(BOT_TOKEN)
    console.log('✅ Bot authenticated successfully!')
    console.log(`   - ID: ${me.id}`)
    console.log(`   - Name: ${me.fullName}`)
    console.log(`   - Username: @${me.username}`)
    console.log(`   - IsBot: ${me.isBot}`)

    console.log('3. Invoking raw help.getConfig query...')
    const config = await bot.invoke<raw.types.Config>(new raw.functions.help.GetConfig())
    console.log(`✅ Raw RPC help.getConfig succeeded!`)
    console.log(`   - Connected DC: ${config.this_dc}`)
    console.log(`   - Max Chat Size: ${config.chat_size_max}`)

    console.log('4. Disconnecting client...')
    await bot.disconnect()
    console.log('🎉 Live MTProto test PASSED completely!')
  } catch (err: any) {
    console.error('❌ Live MTProto test failed:', err)
    if (bot.isConnected) {
      await bot.disconnect()
    }
  }
}

main().catch(console.error)
