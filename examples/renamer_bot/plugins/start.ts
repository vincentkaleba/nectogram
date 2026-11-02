// Port of plugins/about.py + plugins/start.py (start command part only)
import { Client, Message, Filters } from '../../../src/index.js'
import { insert, botdata, find_one, total_user } from '../helper/database.js'
import { humanbytes } from '../helper/progress.js'
import { InlineKeyboardMarkup, InlineKeyboardButton } from '../../../src/index.js'

const token = process.env.BOT_TOKEN || ''
const botid = parseInt(token.split(':')[0], 10)

export default function registerStartHandlers(bot: Client) {

  // /about command — port of plugins/about.py
  bot.onMessage(Filters.command(['about']), async (client: Client, message: Message) => {
    botdata(botid)
    const data = find_one(botid) as any
    const total_rename = data?.total_rename ?? 0
    const total_sz = data?.total_size ?? 0
    await message.reply(
      `Total User:- ${total_user()}\nBot :- @sakura_shareBot\nCreater :- @mrlokaman\nLanguage :-TypeScript\nLibrary :- Nectogram\nServer :- Local\nTotal Renamed File :-${total_rename}\nTotal Size Renamed :- ${humanbytes(parseInt(String(total_sz)))} `
    )
  })

  // /start command — port of plugins/start.py (@Client.on_message filters.command "start")
  bot.onMessage(Filters.command(['start']), async (client: Client, message: Message) => {
    insert(Number(message.chat.id))
    const firstName = message.fromUser?.firstName ?? 'User'

    const now = new Date()
    let wish: string
    if (now.getHours() < 12) wish = 'Good morning.'
    else if (now.getHours() < 18) wish = 'Good afternoon.'
    else wish = 'Good evening.'

    await message.reply(
      `\n\tHello ${wish} ${firstName}\n\t__I am file renamer bot, Please sent any telegram \n\t**Document Or Video** and enter new filename to rename it__\n\t`,
      {
        replyMarkup: new InlineKeyboardMarkup([[
          new InlineKeyboardButton({ text: 'Support 🇮🇳', url: 'https://t.me/lntechnical' }),
        ], [
          new InlineKeyboardButton({ text: 'Subscribe 🧐', url: 'https://youtube.com/c/LNtechnical' }),
        ]]),
      }
    )
  })
}
