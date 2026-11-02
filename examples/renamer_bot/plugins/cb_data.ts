// Port of plugins/cb_data.py
// Handles: cancel, rename, doc, vid, aud callbacks

import { Client, CallbackQuery, Filters, ForceReply, InlineKeyboardMarkup, InlineKeyboardButton } from '../../../src/index.js'
import { progress_for_pyrogram, humanbytes } from '../helper/progress.js'
import { take_screen_shot, fix_thumb } from '../helper/ffmpeg.js'
import { find, find_one, used_limit, dateupdate } from '../helper/database.js'
import { escape_invalid_curly_brackets } from '../helper/set.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

function timedelta(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function getVideoDuration(file_path: string): Promise<number> {
  const { execFile } = await import('child_process')
  const { promisify } = await import('util')
  const execFileAsync = promisify(execFile)
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      file_path,
    ])
    return Math.floor(parseFloat(stdout.trim())) || 0
  } catch {
    return 0
  }
}

async function resolveCallbackMediaMessage(
  client: Client,
  query: CallbackQuery
): Promise<{ cb_msg: any; new_filename: string; media_msg: any; file: any } | null> {
  const chat_id = query.message!.chat.id
  const cb_msg_id = query.message!.id

  const cb_msgs = await client.getMessages(chat_id, cb_msg_id)
  const cb_msg = Array.isArray(cb_msgs) ? cb_msgs[0] : cb_msgs
  if (!cb_msg) {
    console.log(`[cb_data] Could not fetch callback message ${cb_msg_id}`)
    return null
  }

  const raw_text = cb_msg.text ?? cb_msg.caption ?? (cb_msg.raw as any)?.message ?? ''
  const name = raw_text.split(':-')
  const new_filename = name[1]?.trim()?.replace(/`/g, '') ?? ''
  if (!new_filename) {
    console.log(`[cb_data] Could not parse filename from text: "${raw_text}"`)
    return null
  }

  let media_msg: any
  if (cb_msg.replyToMessageId) {
    const msgs = await client.getMessages(chat_id, cb_msg.replyToMessageId)
    media_msg = Array.isArray(msgs) ? msgs[0] : msgs
  }

  if (!media_msg || (!media_msg.document && !media_msg.video && !media_msg.audio)) {
    for (let offset = 1; offset <= 5; offset++) {
      const alt_msgs = await client.getMessages(chat_id, cb_msg_id - offset)
      const alt_msg = Array.isArray(alt_msgs) ? alt_msgs[0] : alt_msgs
      if (alt_msg && (alt_msg.document || alt_msg.video || alt_msg.audio)) {
        media_msg = alt_msg
        break
      }
    }
  }

  if (!media_msg) {
    console.log(`[cb_data] Could not find media_msg for callback ${cb_msg_id}`)
    return null
  }

  const file = media_msg.document || media_msg.video || media_msg.audio
  if (!file) {
    console.log(`[cb_data] No file attachment on media_msg ${media_msg.id}`)
    return null
  }

  return { cb_msg, new_filename, media_msg, file }
}

export default function registerCbDataHandlers(bot: Client) {

  // cancel — port of cb_data.py:cancel
  bot.onCallbackQuery(Filters.callbackData('cancel'), async (client: Client, query: CallbackQuery) => {
    try {
      await query.message?.delete()
    } catch {
      return
    }
  })

  // rename — port of cb_data.py:rename
  bot.onCallbackQuery(Filters.callbackData('rename'), async (client: Client, query: CallbackQuery) => {
    const chat_id = query.message!.chat.id
    let id = query.message!.replyToMessageId

    if (!id) {
      // Fallback: search backwards for media message ID
      for (let offset = 1; offset <= 5; offset++) {
        const msgs = await client.getMessages(chat_id, query.message!.id - offset)
        const msg = Array.isArray(msgs) ? msgs[0] : msgs
        if (msg && (msg.document || msg.video || msg.audio)) {
          id = msg.id
          break
        }
      }
    }
    if (!id) id = query.message!.id - 1

    const date_epoch = Math.floor((query.message!.date instanceof Date ? query.message!.date.getTime() / 1000 : query.message!.date) ?? Date.now() / 1000)

    await query.message!.delete().catch(() => {})
    await client.sendMessage(
      chat_id,
      `__Please enter the new filename...__\n\nNote:- Extension Not Required`,
      {
        replyToMessageId: id,
        replyMarkup: new ForceReply({ selective: true }),
      }
    )
    dateupdate(Number(chat_id), date_epoch)
  })

  // doc — port of cb_data.py:doc
  bot.onCallbackQuery(Filters.callbackData('doc'), async (client: Client, query: CallbackQuery) => {
    console.log(`[cb_data] 'doc' button clicked by ${query.fromUser.id}`)
    const resolved = await resolveCallbackMediaMessage(client, query)
    if (!resolved) return

    const { cb_msg, new_filename, media_msg, file } = resolved
    const file_path = path.join('downloads', new_filename)
    const used_ = find_one(Number(query.fromUser.id)) as any
    const used: number = used_?.used_limit ?? 0
    const file_size = file.file_size ?? 0

    const ms = await cb_msg.edit('```Trying To Download...```')

    used_limit(Number(query.fromUser.id), file_size)
    const c_time = Date.now() / 1000
    const total_used = used + file_size
    used_limit(Number(query.fromUser.id), total_used)

    let downloaded_path: string
    try {
      fs.mkdirSync('downloads', { recursive: true })
      downloaded_path = await client.downloadMedia(media_msg, {
        fileName: new_filename,
        outputDir: 'downloads',
        progress: (current, total) => progress_for_pyrogram(current, total, '``` Trying To Download...```', ms, c_time),
      }) as string
    } catch (e: any) {
      const neg_used = used - file_size
      used_limit(Number(query.fromUser.id), neg_used)
      await ms.edit(String(e?.message ?? e))
      return
    }

    // Rename to desired filename
    if (downloaded_path !== file_path) {
      try { fs.renameSync(downloaded_path, file_path) } catch { }
    }

    const data = find(Number(query.message!.chat.id))
    const c_caption: string | null = data[1]
    const thumb: string | null = data[0]

    let caption: string
    if (c_caption) {
      const doc_list = ['filename', 'filesize']
      const new_tex = escape_invalid_curly_brackets(c_caption, doc_list)
      caption = new_tex
        .replace(/\{filename\}/g, new_filename)
        .replace(/\{filesize\}/g, humanbytes(file_size))
    } else {
      caption = `**${new_filename}**`
    }

    let ph_path: string | null = null
    if (thumb) {
      try {
        ph_path = await client.downloadMedia(thumb, { fileName: 'thumb.jpg', outputDir: os.tmpdir() }) as string
      } catch { }
    }

    const upload_c_time = Date.now() / 1000
    try {
      await ms.edit('```Trying To Upload```')
      await client.sendDocument(query.fromUser.id, file_path, {
        thumb: ph_path ?? undefined,
        caption,
        fileName: new_filename,
        progress: (current, total) => progress_for_pyrogram(current, total, '```Trying To Uploading```', ms, upload_c_time),
      })
      await ms.delete()
      fs.rmSync(file_path, { force: true })
      if (ph_path) fs.rmSync(ph_path, { force: true })
    } catch (e: any) {
      const neg_used = used - file_size
      used_limit(Number(query.fromUser.id), neg_used)
      await ms.edit(String(e?.message ?? e))
      fs.rmSync(file_path, { force: true })
      if (ph_path) try { fs.rmSync(ph_path, { force: true }) } catch { }
    }
  })

  // vid — port of cb_data.py:vid
  bot.onCallbackQuery(Filters.callbackData('vid'), async (client: Client, query: CallbackQuery) => {
    console.log(`[cb_data] 'vid' button clicked by ${query.fromUser.id}`)
    const resolved = await resolveCallbackMediaMessage(client, query)
    if (!resolved) return

    const { cb_msg, new_filename, media_msg, file } = resolved
    const file_path = path.join('downloads', new_filename)
    const used_ = find_one(Number(query.fromUser.id)) as any
    const used: number = used_?.used_limit ?? 0
    const file_size = file.file_size ?? 0

    const ms = await cb_msg.edit('```Trying To Download...```')

    used_limit(Number(query.fromUser.id), file_size)
    const c_time = Date.now() / 1000
    const total_used = used + file_size
    used_limit(Number(query.fromUser.id), total_used)

    let downloaded_path: string
    try {
      fs.mkdirSync('downloads', { recursive: true })
      downloaded_path = await client.downloadMedia(media_msg, {
        fileName: new_filename,
        outputDir: 'downloads',
        progress: (current, total) => progress_for_pyrogram(current, total, '``` Trying To Download...```', ms, c_time),
      }) as string
    } catch (e: any) {
      const neg_used = used - file_size
      used_limit(Number(query.fromUser.id), neg_used)
      await ms.edit(String(e?.message ?? e))
      return
    }

    if (downloaded_path !== file_path) {
      try { fs.renameSync(downloaded_path, file_path) } catch { }
    }

    const duration = await getVideoDuration(file_path)
    const data = find(Number(query.message!.chat.id))
    const c_caption: string | null = data[1]
    const thumb: string | null = data[0]

    let caption: string
    if (c_caption) {
      const vid_list = ['filename', 'filesize', 'duration']
      const new_tex = escape_invalid_curly_brackets(c_caption, vid_list)
      caption = new_tex
        .replace(/\{filename\}/g, new_filename)
        .replace(/\{filesize\}/g, humanbytes(file_size))
        .replace(/\{duration\}/g, timedelta(duration))
    } else {
      caption = `**${new_filename}**`
    }

    let ph_path: string | null = null
    if (thumb) {
      try {
        ph_path = await client.downloadMedia(thumb, { fileName: 'thumb.jpg', outputDir: os.tmpdir() }) as string
      } catch { }
    } else {
      try {
        const ph_path_ = await take_screen_shot(file_path, path.dirname(path.resolve(file_path)), Math.floor(Math.random() * Math.max(duration - 1, 1)))
        const [w, h, fixed] = await fix_thumb(ph_path_)
        ph_path = fixed
      } catch (e) {
        ph_path = null
        console.log(e)
      }
    }

    const upload_c_time = Date.now() / 1000
    try {
      await ms.edit('```Trying To Upload```')
      await client.sendVideo(query.fromUser.id, file_path, {
        thumb: ph_path ?? undefined,
        duration,
        caption,
        fileName: new_filename,
        progress: (current, total) => progress_for_pyrogram(current, total, '```Trying To Uploading```', ms, upload_c_time),
      })
      await ms.delete()
      fs.rmSync(file_path, { force: true })
      if (ph_path) try { fs.rmSync(ph_path, { force: true }) } catch { }
    } catch (e: any) {
      const neg_used = used - file_size
      used_limit(Number(query.fromUser.id), neg_used)
      await ms.edit(String(e?.message ?? e))
      fs.rmSync(file_path, { force: true })
      if (ph_path) try { fs.rmSync(ph_path, { force: true }) } catch { return }
    }
  })

  // aud — port of cb_data.py:aud
  bot.onCallbackQuery(Filters.callbackData('aud'), async (client: Client, query: CallbackQuery) => {
    console.log(`[cb_data] 'aud' button clicked by ${query.fromUser.id}`)
    const resolved = await resolveCallbackMediaMessage(client, query)
    if (!resolved) return

    const { cb_msg, new_filename, media_msg, file } = resolved
    const file_path = path.join('downloads', new_filename)
    const used_ = find_one(Number(query.fromUser.id)) as any
    const used: number = used_?.used_limit ?? 0
    const file_size = file.file_size ?? 0

    const total_used = used + file_size
    used_limit(Number(query.fromUser.id), total_used)

    const ms = await cb_msg.edit('```Trying To Download...```')
    const c_time = Date.now() / 1000

    let downloaded_path: string
    try {
      fs.mkdirSync('downloads', { recursive: true })
      downloaded_path = await client.downloadMedia(media_msg, {
        fileName: new_filename,
        outputDir: 'downloads',
        progress: (current, total) => progress_for_pyrogram(current, total, '``` Trying To Download...```', ms, c_time),
      }) as string
    } catch (e: any) {
      const neg_used = used - file_size
      used_limit(Number(query.fromUser.id), neg_used)
      await ms.edit(String(e?.message ?? e))
      return
    }

    if (downloaded_path !== file_path) {
      try { fs.renameSync(downloaded_path, file_path) } catch { }
    }

    const duration = await getVideoDuration(file_path)
    const data = find(Number(query.message!.chat.id))
    const c_caption: string | null = data[1]
    const thumb: string | null = data[0]

    let caption: string
    if (c_caption) {
      const aud_list = ['filename', 'filesize', 'duration']
      const new_tex = escape_invalid_curly_brackets(c_caption, aud_list)
      caption = new_tex
        .replace(/\{filename\}/g, new_filename)
        .replace(/\{filesize\}/g, humanbytes(file_size))
        .replace(/\{duration\}/g, timedelta(duration))
    } else {
      caption = `**${new_filename}**`
    }

    let ph_path: string | null = null
    if (thumb) {
      try {
        ph_path = await client.downloadMedia(thumb, { fileName: 'thumb.jpg', outputDir: os.tmpdir() }) as string
      } catch { }
    }

    const upload_c_time = Date.now() / 1000
    if (ph_path) {
      try {
        await ms.edit('```Trying To Upload```')
        await client.sendAudio(query.message!.chat.id, file_path, {
          caption,
          thumb: ph_path,
          duration,
          progress: (current, total) => progress_for_pyrogram(current, total, '```Trying To Uploading```', ms, upload_c_time),
        })
        await ms.delete()
        fs.rmSync(file_path, { force: true })
        fs.rmSync(ph_path, { force: true })
      } catch (e: any) {
        const neg_used = used - file_size
        used_limit(Number(query.fromUser.id), neg_used)
        await ms.edit(String(e?.message ?? e))
        fs.rmSync(file_path, { force: true })
        fs.rmSync(ph_path, { force: true })
      }
    } else {
      try {
        await ms.edit('```Trying To Upload```')
        await client.sendAudio(query.message!.chat.id, file_path, {
          caption,
          duration,
          progress: (current, total) => progress_for_pyrogram(current, total, '```Trying To Uploading```', ms, upload_c_time),
        })
        await ms.delete()
        fs.rmSync(file_path, { force: true })
      } catch (e: any) {
        await ms.edit(String(e?.message ?? e))
        const neg_used = used - file_size
        used_limit(Number(query.fromUser.id), neg_used)
        fs.rmSync(file_path, { force: true })
      }
    }
  })
}
