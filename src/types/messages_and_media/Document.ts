//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../raw/index.js'

export interface DocumentOptions {
  fileId?: string
  fileUniqueId?: string
  fileName?: string
  fileSize?: number
  mimeType?: string
  date?: Date
  raw?: raw.types.Document
}

export class Document {
  public readonly fileId?: string
  public readonly fileUniqueId?: string
  public readonly fileName?: string
  public readonly fileSize?: number
  public readonly mimeType?: string
  public readonly date?: Date
  public readonly raw?: raw.types.Document

  constructor(options: DocumentOptions) {
    this.fileId = options.fileId
    this.fileUniqueId = options.fileUniqueId
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

  public static _parse(rawDoc: raw.types.Document): Document {
    let fileName: string | undefined
    if (rawDoc.attributes) {
      for (const attr of rawDoc.attributes) {
        if (attr instanceof raw.types.DocumentAttributeFilename || (attr as any)?.QUALNAME === 'types.DocumentAttributeFilename') {
          fileName = (attr as any).file_name ?? (attr as any).fileName
          break
        }
      }
    }

    return new Document({
      fileId: rawDoc.id?.toString(),
      fileUniqueId: rawDoc.access_hash?.toString(),
      fileName,
      fileSize: rawDoc.size !== undefined ? Number(rawDoc.size) : undefined,
      mimeType: rawDoc.mime_type,
      date: rawDoc.date ? new Date(rawDoc.date * 1000) : undefined,
      raw: rawDoc,
    })
  }
}
