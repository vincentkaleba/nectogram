//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../raw/index.js'

export interface PhotoOptions {
  fileId?: string
  fileUniqueId?: string
  width?: number
  height?: number
  fileSize?: number
  date?: Date
  raw?: raw.types.Photo
}

export class Photo {
  public readonly fileId?: string
  public readonly fileUniqueId?: string
  public readonly width?: number
  public readonly height?: number
  public readonly fileSize?: number
  public readonly date?: Date
  public readonly raw?: raw.types.Photo

  constructor(options: PhotoOptions) {
    this.fileId = options.fileId
    this.fileUniqueId = options.fileUniqueId
    this.width = options.width
    this.height = options.height
    this.fileSize = options.fileSize
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
  public get file_size(): number | undefined {
    return this.fileSize
  }

  public static _parse(rawPhoto: raw.types.Photo): Photo {
    let width: number | undefined
    let height: number | undefined
    let fileSize: number | undefined

    if (rawPhoto.sizes && rawPhoto.sizes.length > 0) {
      // Find largest photo size
      const sizes = rawPhoto.sizes.filter(
        (s) => s instanceof raw.types.PhotoSize || (s as any)?.QUALNAME === 'types.PhotoSize' || (s as any)?.QUALNAME === 'types.PhotoSizeProgressive'
      )
      if (sizes.length > 0) {
        const largest = sizes[sizes.length - 1] as any
        width = largest.w
        height = largest.h
        fileSize = largest.size
      }
    }

    return new Photo({
      fileId: rawPhoto.id?.toString(),
      fileUniqueId: rawPhoto.access_hash?.toString(),
      width,
      height,
      fileSize,
      date: rawPhoto.date ? new Date(rawPhoto.date * 1000) : undefined,
      raw: rawPhoto,
    })
  }
}
