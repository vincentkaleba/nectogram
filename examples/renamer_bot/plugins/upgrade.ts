// Port of plugins/upgrade.py
import { Client, Message, CallbackQuery, Filters, InlineKeyboardMarkup, InlineKeyboardButton } from '../../../src/index.js'

const upgrade_text = `**Free Plan User**
\tDaily  Upload limit 2GB
\tPrice 0
\t
\t**VIP 1 ** 
\tDaily  Upload  limit 50GB
\tPrice Rs 1231  🇮🇳/🌎 15$  per Year 
\t
\t**VIP 2 **
\tDaily Upload limit Unlimited 
\tPrice Rs  2051  🇮🇳/🌎 25$  per Year
\t
\t
\tPay Using Upi I'd \`\`\`9480251952@paytm\`\`\`
\t
\tAfter Payment Send Screenshots Of 
        Payment To Admin`

const upgrade_keyboard = new InlineKeyboardMarkup([[
  new InlineKeyboardButton({ text: 'ADMIN 🛂', url: 'https://t.me/mrlokaman' }),
], [
  new InlineKeyboardButton({ text: 'PayPal 🌎', url: 'https://www.paypal.me/lokamanchendekar' }),
  new InlineKeyboardButton({ text: 'Paytm', url: 'https://p.paytm.me/xCTH/los89jy0' }),
], [
  new InlineKeyboardButton({ text: 'Cancel', callbackData: 'cancel' }),
]])

export default function registerUpgradeHandlers(bot: Client) {

  // upgrade callback — port of upgrade.py:upgrade
  bot.onCallbackQuery(Filters.callbackData('upgrade'), async (client: Client, query: CallbackQuery) => {
    await query.message!.edit(upgrade_text, { replyMarkup: upgrade_keyboard })
  })

  // /upgrade command — port of upgrade.py:upgradecm
  bot.onMessage(Filters.command(['upgrade']), async (client: Client, message: Message) => {
    await message.reply(upgrade_text, { replyMarkup: upgrade_keyboard })
  })
}
