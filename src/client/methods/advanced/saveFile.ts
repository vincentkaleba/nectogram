//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'

export interface SaveFileOptions {
  fileId?: bigint
  filePart?: number
  progress?: (current: number, total: number) => void | Promise<void>
}

export async function saveFile(
  this: Client,
  file: string | Buffer,
  options?: SaveFileOptions
): Promise<raw.types.InputFile | raw.types.InputFileBig> {
  let buffer: Buffer
  let fileName = 'file.dat'

  if (typeof file === 'string') {
    fileName = path.basename(file)
    buffer = await fs.promises.readFile(file)
  } else if (Buffer.isBuffer(file)) {
    buffer = file
  } else {
    throw new Error('Invalid file parameter. Expected file path string or Buffer.')
  }

  const fileSize = buffer.length
  if (fileSize === 0) {
    throw new Error('File size is 0 bytes.')
  }

  const PART_SIZE = 512 * 1024 // 512 KB
  const isBig = fileSize > 10 * 1024 * 1024 // > 10 MB
  const totalParts = Math.ceil(fileSize / PART_SIZE)
  const fileId = options?.fileId ?? BigInt(Math.floor(Math.random() * 1e15))

  const md5Hash = isBig ? null : crypto.createHash('md5')

  for (let part = options?.filePart ?? 0; part < totalParts; part++) {
    const start = part * PART_SIZE
    const end = Math.min(start + PART_SIZE, fileSize)
    const chunk = buffer.subarray(start, end)

    if (md5Hash) {
      md5Hash.update(chunk)
    }

    if (isBig) {
      await this.invoke(
        new raw.functions.upload.SaveBigFilePart(
          fileId,
          part,
          totalParts,
          chunk
        )
      )
    } else {
      await this.invoke(
        new raw.functions.upload.SaveFilePart(
          fileId,
          part,
          chunk
        )
      )
    }

    if (options?.progress) {
      await options.progress(end, fileSize)
    }
  }

  if (isBig) {
    return new raw.types.InputFileBig(fileId, totalParts, fileName)
  } else {
    const md5Hex = md5Hash ? md5Hash.digest('hex') : ''
    return new raw.types.InputFile(fileId, totalParts, fileName, md5Hex)
  }
}
