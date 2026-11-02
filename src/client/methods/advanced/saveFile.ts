//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { Connection } from '../../../connection/Connection.js'
import { Session } from '../../../session/Session.js'
import type { AuthKey } from '../../../session/AuthKey.js'

export interface SaveFileOptions {
  fileId?: bigint
  filePart?: number
  progress?: (current: number, total: number, ...args: any[]) => void | Promise<void>
  progressArgs?: any[]
}

export async function saveFile(
  this: Client,
  file: string | Buffer,
  options?: SaveFileOptions
): Promise<raw.types.InputFile | raw.types.InputFileBig> {
  let fileHandle: fs.promises.FileHandle | undefined
  let fileSize = 0
  let fileName = 'file.dat'
  let buffer: Buffer | undefined

  if (typeof file === 'string') {
    fileName = path.basename(file)
    const stat = await fs.promises.stat(file)
    fileSize = stat.size
    fileHandle = await fs.promises.open(file, 'r')
  } else if (Buffer.isBuffer(file)) {
    buffer = file
    fileSize = buffer.length
  } else {
    throw new Error('Invalid file parameter. Expected file path string or Buffer.')
  }

  if (fileSize === 0) {
    if (fileHandle) await fileHandle.close()
    throw new Error('File size is 0 bytes.')
  }

  const PART_SIZE = 512 * 1024 // 512 KB
  const isBig = fileSize > 10 * 1024 * 1024 // > 10 MB
  const totalParts = Math.ceil(fileSize / PART_SIZE)
  const fileId = options?.fileId ?? BigInt(Math.floor(Math.random() * 1e15))

  const md5Hash = isBig ? null : crypto.createHash('md5')
  console.log(`[saveFile] Initiating upload: filename="${fileName}", size=${fileSize} bytes (${totalParts} parts)`)
  let lastLoggedMB = -1

  // Create a dedicated media session on Telegram's media-only DC endpoint (like Pyrogram)
  const mainDcId = Number(await (this as any).storage?.getDcId?.() ?? 0) || 1
  const mainSession = (this as any).session as Session | undefined

  let mediaSession: Session | undefined
  try {
    const conn = new Connection({ dcId: mainDcId, isMedia: true, testMode: (this as any).testMode ?? false })
    await conn.connect()
    if (mainSession && mainSession.authKey) {
      mediaSession = new Session(conn, mainSession.authKey, mainSession.salt ?? 0n)
      await mediaSession.connect()
      mediaSession.startPingLoop()
    }
  } catch (err: any) {
    console.warn(`[saveFile] Dedicated media session fallback to main session: ${err?.message ?? err}`)
  }

  const invoker = mediaSession ?? this

  try {
    for (let part = options?.filePart ?? 0; part < totalParts; part++) {
      const start = part * PART_SIZE
      const end = Math.min(start + PART_SIZE, fileSize)

      let chunk: Buffer
      if (fileHandle) {
        chunk = Buffer.alloc(end - start)
        await fileHandle.read(chunk, 0, end - start, start)
      } else {
        chunk = buffer!.subarray(start, end)
      }

      if (md5Hash) {
        md5Hash.update(chunk)
      }

      if (isBig) {
        await invoker.invoke(
          new raw.functions.upload.SaveBigFilePart(
            fileId,
            part,
            totalParts,
            chunk
          )
        )
      } else {
        await invoker.invoke(
          new raw.functions.upload.SaveFilePart(
            fileId,
            part,
            chunk
          )
        )
      }

      const currentMB = Math.floor(end / (10 * 1024 * 1024))
      if (currentMB > lastLoggedMB) {
        lastLoggedMB = currentMB
        const pct = Math.round((end / fileSize) * 100)
        console.log(`[saveFile] Uploaded ${(end / (1024 * 1024)).toFixed(1)} MB / ${(fileSize / (1024 * 1024)).toFixed(1)} MB (${pct}%)`)
      }

      if (options?.progress) {
        try {
          Promise.resolve(options.progress(end, fileSize, ...(options.progressArgs ?? []))).catch(() => {})
        } catch {}
      }
    }
  } finally {
    if (fileHandle) {
      await fileHandle.close()
    }
    if (mediaSession) {
      try { mediaSession.close() } catch {}
    }
  }

  console.log(`[saveFile] Upload finished for "${fileName}"`)

  if (isBig) {
    return new raw.types.InputFileBig(fileId, totalParts, fileName)
  } else {
    const md5Hex = md5Hash ? md5Hash.digest('hex') : ''
    return new raw.types.InputFile(fileId, totalParts, fileName, md5Hex)
  }
}

export const uploadFile = saveFile
