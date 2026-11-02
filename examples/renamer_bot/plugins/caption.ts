// Port of plugins/caption.py
import { Client, Message, Filters } from '../../../src/index.js'
import { addcaption, delcaption, find } from '../helper/database.js'

export default function registerCaptionHandlers(bot: Client) {

  // /set_caption — port of caption.py:add_caption
  bot.onMessage(Filters.command('set_caption'), async (client: Client, message: Message) => {
    const parts = message.text?.split(' ') ?? []
    if (parts.length === 1) {
      return await message.reply('**Give me a caption to set.\n\nExample:- `/set_caption File Name`**')
    }
    const caption = message.text!.split(' ').slice(1).join(' ')
    addcaption(Number(message.chat.id), caption)
    await message.reply('**Your Caption successfully added ✅**')
  })

  // /del_caption — port of caption.py:delete_caption
  bot.onMessage(Filters.command('del_caption'), async (client: Client, message: Message) => {
    const caption = find(Number(message.chat.id))[1]
    if (!caption) {
      await message.reply('**You dont have any custom caption**')
      return
    }
    delcaption(Number(message.chat.id))
    await message.reply('**Your caption successfully deleted ✅**')
  })

  // /see_caption — port of caption.py:see_caption
  bot.onMessage(Filters.command('see_caption'), async (client: Client, message: Message) => {
    const caption = find(Number(message.chat.id))[1]
    if (caption) {
      await message.reply(`<b><u>Your Caption:</b></u>\n\n\`${caption}\``)
    } else {
      await message.reply('**You dont have any custom caption**')
    }
  })
}
