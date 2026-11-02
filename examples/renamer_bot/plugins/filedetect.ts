// Port of plugins/filedetect.py
// Handles ForceReply responses — parses filename, shows doc/vid/aud buttons
// CRITICAL: message text format is "**Select the output file type**\n**Output FileName** :- `{filename}`"
// cb_data.py parses this to extract the filename

import { Client, Message, Filters, InlineKeyboardMarkup, InlineKeyboardButton, ForceReply } from '../../../src/index.js'

export default function registerFiledetectHandlers(bot: Client) {

  // Reply to ForceReply — port of filedetect.py:refunc
  bot.onMessage(Filters.reply, async (client: Client, message: Message) => {
    const msgs = await client.getMessages(message.chat.id, message.replyToMessageId!)
    const replied = Array.isArray(msgs) ? msgs[0] : msgs
    if (!replied) return

    // Check if the replied-to message is ForceReply or prompt message
    const isForceReply =
      (replied.replyMarkup && (replied.replyMarkup instanceof ForceReply || (replied.replyMarkup as any).forceReply)) ||
      (replied.text && replied.text.includes('Please enter the new filename'))

    if (!isForceReply) return

    const new_name = message.text ?? ''
    console.log(`[filedetect] Triggered with text: "${new_name}"`)
    await message.delete().catch(() => {})

    let media_msg: Message | undefined
    if (replied.replyToMessageId) {
      const media_msgs = await client.getMessages(message.chat.id, replied.replyToMessageId)
      media_msg = Array.isArray(media_msgs) ? media_msgs[0] : media_msgs
    }

    if (!media_msg || (!media_msg.document && !media_msg.video && !media_msg.audio)) {
      // Fallback: search backwards for original media message
      for (let offset = 1; offset <= 5; offset++) {
        const alt_msgs = await client.getMessages(message.chat.id, (replied.id) - offset)
        const alt_msg = Array.isArray(alt_msgs) ? alt_msgs[0] : alt_msgs
        if (alt_msg && (alt_msg.document || alt_msg.video || alt_msg.audio)) {
          media_msg = alt_msg
          break
        }
      }
    }

    if (!media_msg) {
      console.log('[filedetect] Could not find media_msg for reply')
      return
    }

    const file = media_msg.document || media_msg.video || media_msg.audio
    if (!file) {
      console.log('[filedetect] No file attachment found on media_msg')
      return
    }

    const filename = file.file_name ?? ''
    let mime = ''
    if (media_msg.video) {
      mime = 'video'
    } else if (media_msg.audio) {
      mime = 'audio'
    } else {
      const mime_type = (file as any).mimeType ?? (file as any).mime_type ?? ''
      mime = mime_type.split('/')[0] ?? ''
    }
    const mg_id = media_msg.id

    await replied.delete().catch(() => {})

    let out_filename: string
    const out = new_name.split('.')
    if (out.length > 1) {
      // has extension
      out_filename = new_name
    } else {
      // no extension — take from original filename
      try {
        const orig_parts = filename.split('.')
        if (orig_parts.length < 2) {
          await client.sendMessage(
            message.chat.id,
            '**Error** :  No  Extension in File, Not Supporting',
            { replyToMessageId: mg_id }
          )
          return
        }
        const out_name = orig_parts[orig_parts.length - 1]
        out_filename = new_name + '.' + out_name
      } catch {
        await client.sendMessage(
          message.chat.id,
          '**Error** :  No  Extension in File, Not Supporting',
          { replyToMessageId: mg_id }
        )
        return
      }
    }

    let markup: InlineKeyboardMarkup
    if (mime === 'video') {
      markup = new InlineKeyboardMarkup([[
        new InlineKeyboardButton({ text: '📁 Document', callbackData: 'doc' }),
        new InlineKeyboardButton({ text: '🎥 Video', callbackData: 'vid' }),
      ]])
    } else if (mime === 'audio') {
      markup = new InlineKeyboardMarkup([[
        new InlineKeyboardButton({ text: '📁 Document', callbackData: 'doc' }),
        new InlineKeyboardButton({ text: '🎵 audio', callbackData: 'aud' }),
      ]])
    } else {
      markup = new InlineKeyboardMarkup([[
        new InlineKeyboardButton({ text: '📁 Document', callbackData: 'doc' }),
      ]])
    }

    // IMPORTANT: do NOT change this message format — cb_data.py parses ":-" to get the filename
    await client.sendMessage(
      message.chat.id,
      `**Select the output file type**\n**Output FileName** :- \`${out_filename}\``,
      { replyToMessageId: mg_id, replyMarkup: markup }
    )
  })
}
