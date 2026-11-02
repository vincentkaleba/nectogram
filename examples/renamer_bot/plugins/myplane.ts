// Port of plugins/myplane.py
import { Client, Message, CallbackQuery, Filters, InlineKeyboardMarkup, InlineKeyboardButton } from '../../../src/index.js'
import { find_one, used_limit, daily as daily_, backpre } from '../helper/database.js'
import { humanbytes } from '../helper/progress.js'
import { check_expi } from '../helper/date.js'

export default function registerMyplanHandlers(bot: Client) {

  // /myplan — port of myplane.py:start
  bot.onMessage(Filters.command(['myplan']), async (client: Client, message: Message) => {
    const used_ = find_one(Number(message.fromUser?.id)) as any
    if (!used_) return

    const daily: number = used_.daily
    const today_epoch = Math.floor(new Date(new Date().toISOString().split('T')[0]).getTime() / 1000)
    const expi = daily - today_epoch

    if (expi !== 0) {
      daily_(Number(message.fromUser?.id), today_epoch)
      used_limit(Number(message.fromUser?.id), 0)
    }

    const _newus = find_one(Number(message.fromUser?.id)) as any
    const used: number = _newus?.used_limit ?? 0
    const limit: number = _newus?.uploadlimit ?? 2147483648
    const remain = limit - used
    const user: string = _newus?.usertype ?? 'Free'
    const ends: number | null = _newus?.prexdate ?? null

    if (ends) {
      const pre_check = check_expi(ends)
      if (!pre_check) {
        backpre(Number(message.fromUser?.id))
      }
    }

    let text: string
    if (ends == null) {
      text = `User ID:- \`${message.fromUser?.id}\`\nPlan :- ${user}\nDaly Upload Limit :- ${humanbytes(limit)}\nToday Used :- ${humanbytes(used)}\nRemain:- ${humanbytes(remain)}`
    } else {
      const normal_date = new Date(ends * 1000).toISOString().split('T')[0]
      text = `User ID:- \`${message.fromUser?.id}\`\nPlan :- ${user}\nDaly Upload Limit :- ${humanbytes(limit)}\nToday Used :- ${humanbytes(used)}\nRemain:- ${humanbytes(remain)}\n\n\`\`\`Your Plan Ends On :- ${normal_date}\``
    }

    if (user === 'Free') {
      await message.reply(text, {
        replyMarkup: new InlineKeyboardMarkup([[
          new InlineKeyboardButton({ text: 'Upgrade 💰💳', callbackData: 'upgrade' }),
          new InlineKeyboardButton({ text: 'Cancel ✖️ ', callbackData: 'cancel' }),
        ]]),
      })
    } else {
      await message.reply(text)
    }
  })
}
