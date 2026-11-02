// Port of plugins/thumbfunction.py
import { Client, Message, Filters } from '../../../src/index.js'
import { find, delthumb, addthumb } from '../helper/database.js'

export default function registerThumbHandlers(bot: Client) {

  // /viewthumb — port of thumbfunction.py:viewthumb
  bot.onMessage(Filters.command(['viewthumb']), async (client: Client, message: Message) => {
    console.log(message.chat.id)
    const thumb = find(Number(message.chat.id))[0]
    if (thumb) {
      await client.sendPhoto(message.chat.id, thumb)
    } else {
      await message.reply("**You don't have any custom thumbnail**")
    }
  })

  // /delthumb — port of thumbfunction.py:removethumb
  bot.onMessage(Filters.command(['delthumb']), async (client: Client, message: Message) => {
    delthumb(Number(message.chat.id))
    await message.reply('**Custom thumbnail deleted successfully**')
  })

  // Photo upload → save as thumbnail — port of thumbfunction.py:addthumbs
  bot.onMessage(Filters.photo, async (client: Client, message: Message) => {
    const file_id = String(message.photo?.fileId ?? '')
    if (!file_id) return
    addthumb(Number(message.chat.id), file_id)
    await message.reply('**Custom thumbnail saved successfully** ✅')
  })
}
