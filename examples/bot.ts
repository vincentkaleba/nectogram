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

import { Client, User, Message, CallbackQuery, Filters, InlineKeyboardMarkup, InlineKeyboardButton, RichMessage, ButtonStyle } from '../src/index.js'

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
        new InlineKeyboardButton({ text: '⭐ GitHub Repo', url: 'https://github.com/nectogram/nectogram', style: ButtonStyle.PRIMARY }),
        new InlineKeyboardButton({ text: '🔘 Click Me', callbackData: 'click_demo_button', style: ButtonStyle.SUCCESS }),
      ],
      [
        new InlineKeyboardButton({ text: '🔴 Action Dangereuse', callbackData: 'danger_action', style: ButtonStyle.DANGER }),
      ],
    ])

    const userMention = message.fromUser?.mention ?? 'User'

    try {
      await client.sendMessage(
        message.chat.id,
        `🚀 **Welcome ${userMention}!**\n\nI am powered by **Nectogram**, a high-performance Node.js MTProto Telegram client library!`,
        { replyMarkup: keyboard }
      )
      console.log(`✅ Sent /start response to ${userName}`)
    } catch (err: any) {
      console.error(`❌ Failed to send /start message:`, err)
    }
  })

  // Command: /rich (HTML Rich Message demo)
  bot.onMessage(Filters.command('rich'), async (client: Client, message: Message) => {
    console.log(`📩 Received /rich command from ${message.chat.id}`)
    const htmlRichCard = new RichMessage({
      html: '<h1>HTML Rich Card</h1><p>Contenu <b>enrichi</b> avec <tg-emoji emoji-id="5978545998736134283">👑</tg-emoji><tg-emoji emoji-id="6026240790219460632">🦦</tg-emoji><tg-emoji emoji-id="5899883552450809632">🔒</tg-emoji><tg-emoji emoji-id="5899952671359504050">💜</tg-emoji><tg-emoji emoji-id="5899859522108789256">🩵</tg-emoji><tg-emoji emoji-id="5899824114398401049">🅰</tg-emoji><tg-emoji emoji-id="5899838712992240333">🔐</tg-emoji><tg-emoji emoji-id="5899848299359244592">🅰</tg-emoji><tg-emoji emoji-id="6026095130698584657">👆</tg-emoji><tg-emoji emoji-id="6026310858315927807">📶</tg-emoji><tg-emoji emoji-id="6026164816542961349">🛜</tg-emoji><tg-emoji emoji-id="6024048153580277867">🔄</tg-emoji><tg-emoji emoji-id="6024100028195279285">⬜️</tg-emoji><tg-emoji emoji-id="6023902876311490783">🍏</tg-emoji><tg-emoji emoji-id="5899731270090363274">👨‍🚀</tg-emoji><tg-emoji emoji-id="5902266357356957306">👽</tg-emoji><tg-emoji emoji-id="5899963696540553269">🪐</tg-emoji><tg-emoji emoji-id="5900276580613099895">🪐</tg-emoji><tg-emoji emoji-id="5901987429295854086">💫</tg-emoji><tg-emoji emoji-id="5899976529902833919">♾</tg-emoji><tg-emoji emoji-id="5900235542200586578">👁</tg-emoji><tg-emoji emoji-id="5902204801885671680">🐱</tg-emoji><tg-emoji emoji-id="5900093954308705855">0⃣</tg-emoji><tg-emoji emoji-id="5899760673436471128">1⃣</tg-emoji><tg-emoji emoji-id="5900246704820588032">2⃣</tg-emoji><tg-emoji emoji-id="5899833069405212539">3⃣</tg-emoji><tg-emoji emoji-id="5902058515299569197">4⃣</tg-emoji><tg-emoji emoji-id="5902262135404105258">5⃣</tg-emoji><tg-emoji emoji-id="5899898778109875302">6⃣</tg-emoji><tg-emoji emoji-id="5899814639700545792">7⃣</tg-emoji><tg-emoji emoji-id="5899920321665831080">8⃣</tg-emoji><tg-emoji emoji-id="5899966475384393828">9⃣</tg-emoji><tg-emoji emoji-id="5900223078205493062">☘</tg-emoji><tg-emoji emoji-id="5902444903442420242">⚜</tg-emoji><tg-emoji emoji-id="5900190475108749323">☘</tg-emoji><tg-emoji emoji-id="5897862946431701391">✔️</tg-emoji><tg-emoji emoji-id="5902053593267049016">✅</tg-emoji><tg-emoji emoji-id="5902420349114388325">✔️</tg-emoji><tg-emoji emoji-id="5899945812296731931">✅</tg-emoji><tg-emoji emoji-id="5900186420659622041">✅</tg-emoji><tg-emoji emoji-id="5900159478329773802">⭐️</tg-emoji><tg-emoji emoji-id="5899735084021322380">✈️</tg-emoji></p>',
      noAutoLink: true,
    })
    try {
      await client.sendMessage(message.chat.id, 'Voici un Rich Message au format HTML !', {
        richMessage: htmlRichCard,
      })
      console.log(`✅ Replied to /rich`)
    } catch (err: any) {
      console.error(`❌ Failed to send /rich message:`, err)
    }
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

  // Fallback handler: responds to ANY message that didn't match previous filters
  bot.onMessage(async (client: Client, message: Message) => {
    console.log(`📩 Received fallback message "${message.text}" from chat ${message.chat.id}`)
    try {
      await client.sendMessage(message.chat.id, `🤖 Nectogram Bot received your message: **"${message.text ?? ''}"**\n\nTry commands: /start, /ping, /rich!`)
      console.log(`✅ Sent fallback response to chat ${message.chat.id}`)
    } catch (err: any) {
      console.error(`❌ Failed to send fallback response:`, err)
    }
  })

  // Callback Query Handler (Inline Button Clicks)
  bot.onCallbackQuery(Filters.regex(/click_demo_button/), async (client: Client, query: CallbackQuery) => {
    try {
      console.log(`🔘 Inline button clicked by user ${query.fromUser.id} (Data: ${query.data})`)
      await client.answerCallbackQuery(query.id, { text: '🎉 Button clicked successfully!', showAlert: true })
    } catch (err: any) {
      console.error(`❌ Error handling click_demo_button:`, err)
    }
  })

  bot.onCallbackQuery(Filters.regex(/danger_action/), async (client: Client, query: CallbackQuery) => {
    try {
      console.log(`🔴 Danger action clicked by user ${query.fromUser.id}`)
      await client.answerCallbackQuery(query.id, { text: '⚠️ Danger action triggered!', showAlert: true })
    } catch (err: any) {
      console.error(`❌ Error handling danger_action:`, err)
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
