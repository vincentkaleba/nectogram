// Port of plugins/admin.py
import { Client, Message, CallbackQuery, Filters, InlineKeyboardMarkup, InlineKeyboardButton } from '../../../src/index.js'
import { uploadlimit, usertype, addpre } from '../helper/database.js'
import { add_date } from '../helper/date.js'

const ADMIN = parseInt(process.env.ADMIN ?? '923943045', 10)

export default function registerAdminHandlers(bot: Client) {

  // /warn — port of admin.py:warn
  bot.onMessage(Filters.command(['warn']), async (client: Client, message: Message) => {
    if (Number(message.fromUser?.id) !== ADMIN) return
    const parts = message.text?.split(' ', 3) ?? []
    if (parts.length >= 3) {
      try {
        const user_id = parts[1]
        const reason = parts[2]
        await message.reply('User Notfied Sucessfully')
        await client.sendMessage(parseInt(user_id, 10), reason)
      } catch {
        await message.reply('User Not Notfied Sucessfully 😔')
      }
    }
  })

  // /addpremium — port of admin.py:buypremium
  bot.onMessage(Filters.command(['addpremium']), async (client: Client, message: Message) => {
    if (Number(message.fromUser?.id) !== ADMIN) return
    await message.reply('Select Plan.........', {
      replyMarkup: new InlineKeyboardMarkup([[
        new InlineKeyboardButton({ text: 'VIP 1', callbackData: 'vip1' }),
        new InlineKeyboardButton({ text: 'VIP 2', callbackData: 'vip2' }),
      ]]),
    })
  })

  // vip1 callback
  bot.onCallbackQuery(Filters.callbackData('vip1'), async (client: Client, query: CallbackQuery) => {
    const msgs_v1 = query.message?.replyToMessageId
      ? await client.getMessages(query.message!.chat.id, query.message!.replyToMessageId!)
      : []
    const textMsg1 = Array.isArray(msgs_v1) ? msgs_v1[0] : msgs_v1
    const text = textMsg1?.text ?? ''
    const id = text.split('/addpremium')
    const user_id = id[1]?.replace(' ', '').trim() ?? ''
    if (!user_id) return
    uploadlimit(parseInt(user_id, 10), 53687091200)
    usertype(parseInt(user_id, 10), 'VIP1')
    addpre(parseInt(user_id, 10))
    await query.message!.edit('Added successfully To Premium Upload limit 10 GB')
    await client.sendMessage(parseInt(user_id, 10), 'Hey Ur Upgraded To VIP 1 check your plan here /myplan')
  })

  // vip2 callback
  bot.onCallbackQuery(Filters.callbackData('vip2'), async (client: Client, query: CallbackQuery) => {
    const msgs_v2 = query.message?.replyToMessageId
      ? await client.getMessages(query.message!.chat.id, query.message!.replyToMessageId!)
      : []
    const textMsg2 = Array.isArray(msgs_v2) ? msgs_v2[0] : msgs_v2
    const text2 = textMsg2?.text ?? ''
    const id = text2.split('/addpremium')
    const user_id = id[1]?.replace(' ', '').trim() ?? ''
    if (!user_id) return
    uploadlimit(parseInt(user_id, 10), 53687091200)
    usertype(parseInt(user_id, 10), 'VIP2')
    addpre(parseInt(user_id, 10))
    await query.message!.edit('Added successfully To Premium Upload limit 50 GB')
    await client.sendMessage(parseInt(user_id, 10), 'Hey Ur Upgraded To VIP 2 check your plan here /myplan')
  })
}
