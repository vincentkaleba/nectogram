// Port of plugins/start.py — send_doc handler (media received)
// This is the handler that fires when a document/video/audio is received
import { Client, Message, Filters, InlineKeyboardMarkup, InlineKeyboardButton } from '../../../src/index.js'
import { insert, find_one, used_limit, total_rename, total_size, daily as daily_, used_limit as setUsedLimit } from '../helper/database.js'
import { humanbytes } from '../helper/progress.js'
import { check_expi } from '../helper/date.js'

const token = process.env.BOT_TOKEN || ''
const botid = parseInt(token.split(':')[0], 10)
const CHANNEL = process.env.CHANNEL || ''

export default function registerSendDocHandler(bot: Client) {

  // Media received (document | video | audio) — port of start.py:send_doc
  bot.onMessage(Filters.media, async (client: Client, message: Message) => {
    // Only handle doc/video/audio (not photo)
    if (!message.document && !message.video && !message.audio) return

    const user_id = Number(message.fromUser?.id ?? message.chat.id)
    insert(user_id)

    try {
      const bot_data = find_one(botid) as any
      const prrename = bot_data?.total_rename ?? 0
      const prsize = bot_data?.total_size ?? 0
      const user_deta = find_one(user_id) as any

      if (!user_deta) {
        await message.reply('database has been Cleared click on /start')
        return
      }

      const used_date: number = user_deta.date
      const buy_date: number | null = user_deta.prexdate
      const daily: number = user_deta.daily
      const user_type: string = user_deta.usertype

      const c_time = Date.now() / 1000

      let LIMIT: number
      if (user_type === 'Free') {
        LIMIT = 600
        await message.reply(
          `Complete The Task and get Free subscription per day . Watch full video https://lntechnical.works/${user_id} `
        )
        return
      } else if (user_type === 'NORMAL') {
        LIMIT = 250
      } else {
        LIMIT = 30
      }

      const then = used_date + LIMIT
      const left = Math.round(then - c_time)
      if (left > 0) {
        const ltime = new Date(left * 1000).toISOString().substr(11, 8)
        await message.reply(
          `\`\`\`Sorry Dude I am not only for YOU \n Flood control is active so please wait for ${ltime}\`\`\``
        )
        return
      }

      // Get file info
      const file = message.document || message.video || message.audio
      if (!file) return

      const filename = file.file_name ?? 'unknown'
      const file_size = file.file_size ?? 0

      const value = 2147483648
      const used_ = find_one(user_id) as any
      const used = used_?.used_limit ?? 0
      const limit = used_?.uploadlimit ?? 2147483648

      // Daily reset check
      const today_epoch = Math.floor(new Date(new Date().toISOString().split('T')[0]).getTime() / 1000)
      const expi = daily - today_epoch
      if (expi !== 0) {
        daily_(user_id, today_epoch)
        setUsedLimit(user_id, 0)
        if (user_type === 'NORMAL') {
          // usertype reset to Free per original logic
        }
      }

      const remain = limit - used
      if (remain < file_size) {
        await message.reply(
          `Sorry! I can't upload files that are larger than ${humanbytes(limit)}. File size detected ${humanbytes(file_size)}\nUsed Daly Limit ${humanbytes(used)} If U Want to Rename Large File Upgrade Your Plan `,
          {
            replyMarkup: new InlineKeyboardMarkup([[
              new InlineKeyboardButton({ text: 'Upgrade 💰💳', callbackData: 'upgrade' }),
            ]]),
          }
        )
        return
      }

      if (value < file_size) {
        // > 2GB files — require premium
        if (buy_date == null) {
          await message.reply(
            ` You Can't Upload More Then ${humanbytes(limit)} Used Daly Limit ${humanbytes(used)} `,
            {
              replyMarkup: new InlineKeyboardMarkup([[
                new InlineKeyboardButton({ text: 'Upgrade 💰💳', callbackData: 'upgrade' }),
              ]]),
            }
          )
          return
        }
        const pre_check = check_expi(buy_date)
        if (pre_check) {
          total_rename(botid, prrename)
          total_size(botid, prsize, file_size)
          await message.reply(
            `__What do you want me to do with this file?__\n**File Name** :- ${filename}\n**File Size** :- ${humanbytes(file_size)}`,
            {
              replyMarkup: new InlineKeyboardMarkup([[
                new InlineKeyboardButton({ text: '📝 Rename', callbackData: 'rename' }),
                new InlineKeyboardButton({ text: '✖️ Cancel', callbackData: 'cancel' }),
              ]]),
            }
          )
        } else {
          await message.reply(`Your Plane Expired`)
          return
        }
      } else {
        // <= 2GB files
        if (buy_date) {
          const pre_check = check_expi(buy_date)
          // just checks expiry, no action needed for normal flow
        }
        total_rename(botid, prrename)
        total_size(botid, prsize, file_size)
        await message.reply(
          `__What do you want me to do with this file?__\n**File Name** :- ${filename}\n**File Size** :- ${humanbytes(file_size)}`,
          {
            replyMarkup: new InlineKeyboardMarkup([[
              new InlineKeyboardButton({ text: '📝 Rename', callbackData: 'rename' }),
              new InlineKeyboardButton({ text: '✖️ Cancel', callbackData: 'cancel' }),
            ]]),
          }
        )
      }
    } catch (e) {
      await message.reply('Use About cmd first /about')
    }
  })
}
