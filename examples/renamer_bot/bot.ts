// Port of bot.py
import { Client, Logger } from '../../src/index.js'
import fs from 'fs'
import path from 'path'

// Load .env (no dotenv dependency)
function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...vals] = trimmed.split('=')
          const val = vals.join('=').trim().replace(/^["']|["']$/g, '')
          if (key && process.env[key.trim()] === undefined) {
            process.env[key.trim()] = val
          }
        }
      }
    } catch { }
  }
}
loadEnv()

import registerStartHandlers from './plugins/start.js'
import registerThumbHandlers from './plugins/thumbfunction.js'
import registerCaptionHandlers from './plugins/caption.js'
import registerSendDocHandler from './plugins/send_doc.js'
import registerFiledetectHandlers from './plugins/filedetect.js'
import registerCbDataHandlers from './plugins/cb_data.js'
import registerAdminHandlers from './plugins/admin.js'
import registerBroadcastHandlers from './plugins/broadcast.js'
import registerMyplanHandlers from './plugins/myplane.js'
import registerUpgradeHandlers from './plugins/upgrade.js'

const TOKEN = process.env.BOT_TOKEN ?? process.env.TOKEN ?? ''
const API_ID = parseInt(process.env.API_ID ?? '0', 10)
const API_HASH = process.env.API_HASH ?? ''

if (!TOKEN || !API_ID || !API_HASH) {
  console.error('❌ BOT_TOKEN, API_ID and API_HASH must be set')
  process.exit(1)
}

Logger.setLevel('INFO')

process.on('uncaughtException', (err) => {
  console.error('❌ [UncaughtException]', err)
})

process.on('unhandledRejection', (reason) => {
  console.error('❌ [UnhandledRejection]', reason)
})

const bot = new Client({
  name: 'Renamer',
  botToken: TOKEN,
  apiId: API_ID,
  apiHash: API_HASH,
})

// Register all plugins (same order as Pyrogram's plugin loader)
registerStartHandlers(bot)
registerThumbHandlers(bot)
registerCaptionHandlers(bot)
registerSendDocHandler(bot)
registerFiledetectHandlers(bot)
registerCbDataHandlers(bot)
registerAdminHandlers(bot)
registerBroadcastHandlers(bot)
registerMyplanHandlers(bot)
registerUpgradeHandlers(bot)

bot.start().then(() => {
  console.log('Bot is running!')
}).catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
