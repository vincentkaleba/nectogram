//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../raw/index.js'

export interface AudioOptions {
  fileId?: string
  fileUniqueId?: string
  duration?: number
  performer?: string
  title?: string
  fileName?: string
  fileSize?: number
  mimeType?: string
  date?: Date
  raw?: raw.types.Document
}

export class Audio {
  public readonly fileId?: string
  public readonly fileUniqueId?: string
  public readonly duration?: number
  public readonly performer?: string
  public readonly title?: string
  public readonly fileName?: string
  public readonly fileSize?: number
  public readonly mimeType?: string
  public readonly date?: Date
  public readonly raw?: raw.types.Document

  constructor(options: AudioOptions) {
    this.fileId = options.fileId
    this.fileUniqueId = options.fileUniqueId
    this.duration = options.duration
    this.performer = options.performer
    this.title = options.title
    this.fileName = options.fileName
    this.fileSize = options.fileSize
    this.mimeType = options.mimeType
    this.date = options.date
    this.raw = options.raw
  }

  // Pyrogram snake_case aliases
  public get file_id(): string | undefined {
    return this.fileId
  }
  public get file_unique_id(): string | undefined {
    return this.fileUniqueId
  }
  public get file_name(): string | undefined {
    return this.fileName
  }
  public get file_size(): number | undefined {
    return this.fileSize
  }
  public get mime_type(): string | undefined {
    return this.mimeType
  }

  public static _parse(rawDoc: raw.types.Document): Audio {
    let duration: number | undefined
    let performer: string | undefined
    let title: string | undefined
    let fileName: string | undefined

    if (rawDoc.attributes) {
      for (const attr of rawDoc.attributes) {
        if (attr instanceof raw.types.DocumentAttributeAudio || (attr as any)?.QUALNAME === 'types.DocumentAttributeAudio') {
          duration = (attr as any).duration
          performer = (attr as any).performer
          title = (attr as any).title
        } else if (attr instanceof raw.types.DocumentAttributeFilename || (attr as any)?.QUALNAME === 'types.DocumentAttributeFilename') {
          fileName = (attr as any).file_name ?? (attr as any).fileName
        }
      }
    }

    return new Audio({
      fileId: rawDoc.id?.toString(),
      fileUniqueId: rawDoc.access_hash?.toString(),
      duration,
      performer,
      title,
      fileName,
      fileSize: rawDoc.size !== undefined ? Number(rawDoc.size) : undefined,
      mimeType: rawDoc.mime_type,
      date: rawDoc.date ? new Date(rawDoc.date * 1000) : undefined,
      raw: rawDoc,
    })
  }
}
