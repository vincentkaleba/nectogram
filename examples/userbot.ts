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

import { Client, Message, Filters } from '../src/index.js'

const API_ID = Number(process.env.API_ID || 123456)
const API_HASH = process.env.API_HASH || '0123456789abcdef0123456789abcdef'
const SESSION_STRING = process.env.SESSION_STRING || ''

async function main() {
  console.log('⚡ Initializing Nectogram Userbot...')

  const app = new Client({
    name: 'nectogram_userbot',
    apiId: API_ID,
    apiHash: API_HASH,
    sessionString: SESSION_STRING,
  })

  // Command: .ping (only executed for outgoing messages sent by yourself)
  app.onMessage(Filters.me.and(Filters.command('ping', '.')), async (client: Client, message: Message) => {
    const start = Date.now()
    await client.editMessageText(message.chat.id, message.id, '⚡ **Nectogram Userbot** is active!')
    const latency = Date.now() - start
    await client.editMessageText(
      message.chat.id,
      message.id,
      `⚡ **Nectogram Userbot**\n⏱️ Latency: \`${latency}ms\``
    )
  })

  // Command: .session (exports session string safely)
  app.onMessage(Filters.me.and(Filters.command('session', '.')), async (client: Client, message: Message) => {
    const sessionStr = await client.exportSessionString()
    await client.editMessageText(
      message.chat.id,
      message.id,
      `🔒 **Pyrogram-Compatible Session String**:\n\`\`\`\n${sessionStr}\n\`\`\``
    )
  })

  // Command: .purge (deletes replied message and trigger command)
  app.onMessage(Filters.me.and(Filters.command('purge', '.')), async (client: Client, message: Message) => {
    if (message.replyToMessageId) {
      await client.deleteMessages(message.chat.id, [message.id, message.replyToMessageId])
    }
  })

  console.log('✅ Userbot handlers configured.')
}

main().catch(console.error)
