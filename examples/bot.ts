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

import { Client, User, Message, CallbackQuery, Filters, InlineKeyboardMarkup, InlineKeyboardButton } from '../src/index.js'

// Configure your Telegram API credentials
const API_ID = Number(process.env.API_ID || 123456)
const API_HASH = process.env.API_HASH || '0123456789abcdef0123456789abcdef'
const BOT_TOKEN = process.env.BOT_TOKEN || '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ'

async function main() {
  console.log('🚀 Initializing Nectogram Bot...')

  const bot = new Client({
    name: 'nectogram_demo_bot',
    apiId: API_ID,
    apiHash: API_HASH,
    inMemory: false, // Save session file (nectogram_demo_bot.session) on disk
  })

  // Command: /start
  bot.onMessage(Filters.command('start'), async (client: Client, message: Message) => {
    const userName = message.fromUser?.fullName ?? message.fromUser?.id?.toString() ?? 'User'
    console.log(`📩 Received /start command from ${userName}`)

    const keyboard = new InlineKeyboardMarkup([
      [
        new InlineKeyboardButton({ text: '⭐ GitHub Repo', url: 'https://github.com/nectogram/nectogram', style: 'primary' }),
        new InlineKeyboardButton({ text: '🔘 Click Me', callbackData: 'click_demo_button', style: 'success' }),
      ],
      [
        new InlineKeyboardButton({ text: '🔴 Action Dangereuse', callbackData: 'danger_action', style: 'danger' }),
      ],
    ])

    const displayName = message.fromUser?.firstName ?? message.fromUser?.username ?? 'there'
    await client.sendMessage(
      message.chat.id,
      `👋 Welcome **${displayName}**!\n\nI am powered by **Nectogram**, a high-performance Node.js MTProto client library!`,
      { replyMarkup: keyboard }
    )
    console.log(`✅ Replied to /start from ${userName}`)
  })

  // Command: /ping
  bot.onMessage(Filters.command('ping'), async (client: Client, message: Message) => {
    console.log(`📩 Received /ping command from ${message.fromUser?.fullName ?? message.chat.id}`)
    const start = Date.now()
    const sent = await client.sendMessage(message.chat.id, '🏓 Ponging...')
    const latency = Date.now() - start
    await client.editMessageText(message.chat.id, sent.id, `🏓 **Pong!** Latency: \`${latency}ms\``)
    console.log(`✅ Replied to /ping with ${latency}ms latency`)
  })

  // Filter: Regex matching "hello"
  bot.onMessage(Filters.regex(/hello/i), async (client: Client, message: Message) => {
    console.log(`📩 Received hello message from ${message.fromUser?.fullName ?? message.chat.id}`)
    await client.sendMessage(message.chat.id, `Hello there! How can I help you today?`, {
      replyToMessageId: message.id,
    })
    console.log(`✅ Replied to hello message`)
  })

  // Callback Query Handler (Inline Button Clicks)
  bot.onCallbackQuery(Filters.regex(/click_demo_button/), async (client: Client, query: CallbackQuery) => {
    console.log(`🔘 Inline button clicked by user ${query.fromUser.id}`)
    if (query.matches) {
      console.log('Regex match:', query.matches[0])
    }
  })

  // Start client and authenticate bot
  if (BOT_TOKEN && BOT_TOKEN !== '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ') {
    await bot.connect()
    let me: User
    try {
      me = await bot.getMe()
      console.log(`✅ Session active for @${me.username} (ID: ${me.id}) from nectogram_demo_bot.session`)
    } catch (err) {
      console.log('Authenticating bot token via signInBot...')
      me = await bot.signInBot(BOT_TOKEN)
      console.log(`✅ Bot authenticated as @${me.username} (ID: ${me.id})`)
    }
    bot.dispatcher.start()
    console.log('🤖 Bot is now running and listening for commands!')
  } else {
    console.log('ℹ️ Demo client initialized successfully. Provide a valid BOT_TOKEN to connect in live mode.')
  }
}

main().catch(console.error)
