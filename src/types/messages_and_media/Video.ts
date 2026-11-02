//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../raw/index.js'

export interface VideoOptions {
  fileId?: string
  fileUniqueId?: string
  width?: number
  height?: number
  duration?: number
  fileName?: string
  fileSize?: number
  mimeType?: string
  supportsStreaming?: boolean
  date?: Date
  raw?: raw.types.Document
}

export class Video {
  public readonly fileId?: string
  public readonly fileUniqueId?: string
  public readonly width?: number
  public readonly height?: number
  public readonly duration?: number
  public readonly fileName?: string
  public readonly fileSize?: number
  public readonly mimeType?: string
  public readonly supportsStreaming?: boolean
  public readonly date?: Date
  public readonly raw?: raw.types.Document

  constructor(options: VideoOptions) {
    this.fileId = options.fileId
    this.fileUniqueId = options.fileUniqueId
    this.width = options.width
    this.height = options.height
    this.duration = options.duration
    this.fileName = options.fileName
    this.fileSize = options.fileSize
    this.mimeType = options.mimeType
    this.supportsStreaming = options.supportsStreaming
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
  public get supports_streaming(): boolean | undefined {
    return this.supportsStreaming
  }

  public static _parse(rawDoc: raw.types.Document): Video {
    let width: number | undefined
    let height: number | undefined
    let duration: number | undefined
    let supportsStreaming: boolean | undefined
    let fileName: string | undefined

    if (rawDoc.attributes) {
      for (const attr of rawDoc.attributes) {
        if (attr instanceof raw.types.DocumentAttributeVideo || (attr as any)?.QUALNAME === 'types.DocumentAttributeVideo') {
          width = (attr as any).w
          height = (attr as any).h
          duration = (attr as any).duration
          supportsStreaming = (attr as any).supports_streaming ?? (attr as any).supportsStreaming
        } else if (attr instanceof raw.types.DocumentAttributeFilename || (attr as any)?.QUALNAME === 'types.DocumentAttributeFilename') {
          fileName = (attr as any).file_name ?? (attr as any).fileName
        }
      }
    }

    return new Video({
      fileId: rawDoc.id?.toString(),
      fileUniqueId: rawDoc.access_hash?.toString(),
      width,
      height,
      duration,
      fileName,
      fileSize: rawDoc.size !== undefined ? Number(rawDoc.size) : undefined,
      mimeType: rawDoc.mime_type,
      supportsStreaming,
      date: rawDoc.date ? new Date(rawDoc.date * 1000) : undefined,
      raw: rawDoc,
    })
  }
}
