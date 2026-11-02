// Port of plugins/broadcast.py
import { Client, Message, Filters } from '../../../src/index.js'
import { getid, deleteUser } from '../helper/database.js'

const ADMIN = parseInt(process.env.ADMIN ?? '923943045', 10)

export default function registerBroadcastHandlers(bot: Client) {

  // /broadcast — port of broadcast.py:broadcast (reply_to_message required)
  bot.onMessage(Filters.command(['broadcast']), async (client: Client, message: Message) => {
    if (Number(message.fromUser?.id) !== ADMIN) return
    if (!message.replyToMessageId) return

    const ms = await message.reply('Geting All ids from database ...........')
    const ids = getid()
    const tot = ids.length
    let success = 0
    let failed = 0

    await ms.edit(`Starting Broadcast .... \n Sending Message To ${tot} Users`)

    for (const id of ids) {
      try {
        await new Promise(r => setTimeout(r, 1000))
        // Copy the replied-to message to this user
        const orig_msgs = await client.getMessages(message.chat.id, message.replyToMessageId!)
        const orig = Array.isArray(orig_msgs) ? orig_msgs[0] : orig_msgs
        if (orig?.text) {
          await client.sendMessage(id, orig.text)
        }
        success++
      } catch {
        failed++
        deleteUser(id)
      }
      try {
        await ms.edit(`Message sent to ${success} chat(s). ${failed} chat(s) failed on receiving message. \nTotal - ${tot}`)
      } catch { }
    }
  })
}
