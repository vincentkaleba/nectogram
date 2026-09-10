//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//
//  This file is part of Nectogram.
//
//  Nectogram is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Lesser General Public License as published
//  by the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  Nectogram is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Lesser General Public License for more details.
//
//  You should have received a copy of the GNU Lesser General Public License
//  along with Nectogram.  If not, see <http://www.gnu.org/licenses/>.

import * as raw from '../raw/index.js'
import { ParsedText, EntitySpan } from './markdown.js'

/**
 * Parse Telegram HTML formatted text into plain text and MTProto MessageEntity array.
 */
export function parseHTML(html: string): ParsedText {
  if (!html) return { text: '', entities: [] }

  let output = ''
  const spans: EntitySpan[] = []
  const stack: Array<{ tag: string; start: number; param?: string }> = []

  let i = 0
  while (i < html.length) {
    if (html[i] === '<') {
      const closeTagIdx = html.indexOf('>', i)
      if (closeTagIdx !== -1) {
        const tagContent = html.substring(i + 1, closeTagIdx).trim()
        i = closeTagIdx + 1

        if (tagContent.startsWith('/')) {
          const tagName = tagContent.substring(1).toLowerCase()
          for (let s = stack.length - 1; s >= 0; s--) {
            if (stack[s].tag === tagName) {
              const open = stack.splice(s, 1)[0]
              const start = open.start
              const end = output.length
              if (end > start) {
                let type: EntitySpan['type'] | undefined
                if (tagName === 'b' || tagName === 'strong') type = 'bold'
                else if (tagName === 'i' || tagName === 'em') type = 'italic'
                else if (tagName === 'code') type = 'code'
                else if (tagName === 'pre') type = 'pre'
                else if (tagName === 'a') type = 'text_url'
                else if (tagName === 's' || tagName === 'strike' || tagName === 'del') type = 'strike'
                else if (tagName === 'u') type = 'underline'
                else if (tagName === 'tg-spoiler') type = 'spoiler'
                else if (tagName === 'blockquote') type = 'blockquote'

                if (type) {
                  spans.push({ type, start, end, param: open.param })
                }
              }
              break
            }
          }
        } else {
          const spaceIdx = tagContent.indexOf(' ')
          const tagName = (spaceIdx === -1 ? tagContent : tagContent.substring(0, spaceIdx)).toLowerCase()
          let param: string | undefined

          if (tagName === 'a') {
            const hrefMatch = tagContent.match(/href=["']([^"']+)["']/)
            if (hrefMatch) param = hrefMatch[1]
          } else if (tagName === 'code') {
            const classMatch = tagContent.match(/class=["']language-([^"']+)["']/)
            if (classMatch) param = classMatch[1]
          }

          stack.push({ tag: tagName, start: output.length, param })
        }
        continue
      }
    }

    if (html[i] === '&') {
      if (html.startsWith('&lt;', i)) { output += '<'; i += 4; continue }
      if (html.startsWith('&gt;', i)) { output += '>'; i += 4; continue }
      if (html.startsWith('&amp;', i)) { output += '&'; i += 5; continue }
      if (html.startsWith('&quot;', i)) { output += '"'; i += 6; continue }
    }

    output += html[i]
    i++
  }

  const entities: raw.base.MessageEntity[] = []
  for (const span of spans) {
    const offset = span.start
    const length = span.end - span.start
    if (length <= 0) continue

    switch (span.type) {
      case 'bold':
        entities.push(new raw.types.MessageEntityBold(offset, length))
        break
      case 'italic':
        entities.push(new raw.types.MessageEntityItalic(offset, length))
        break
      case 'code':
        entities.push(new raw.types.MessageEntityCode(offset, length))
        break
      case 'pre':
        entities.push(new raw.types.MessageEntityPre(offset, length, span.param || ''))
        break
      case 'text_url':
        entities.push(new raw.types.MessageEntityTextUrl(offset, length, span.param || ''))
        break
      case 'spoiler':
        entities.push(new raw.types.MessageEntitySpoiler(offset, length))
        break
      case 'strike':
        entities.push(new raw.types.MessageEntityStrike(offset, length))
        break
      case 'underline':
        entities.push(new raw.types.MessageEntityUnderline(offset, length))
        break
      case 'blockquote':
        entities.push(new raw.types.MessageEntityBlockquote(offset, length))
        break
    }
  }

  return { text: output, entities }
}
