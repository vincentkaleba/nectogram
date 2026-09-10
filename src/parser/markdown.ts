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

export interface ParsedText {
  text: string
  entities: raw.base.MessageEntity[]
}

export interface EntitySpan {
  type: 'bold' | 'italic' | 'code' | 'pre' | 'text_url' | 'spoiler' | 'strike' | 'underline' | 'blockquote'
  start: number
  end: number
  param?: string
}

/**
 * Parse Telegram Markdown formatted text into plain text and MTProto MessageEntity array.
 */
export function parseMarkdown(input: string): ParsedText {
  if (!input) return { text: '', entities: [] }

  const parseTokens = (str: string): { clean: string; spans: EntitySpan[] } => {
    let output = ''
    const localSpans: EntitySpan[] = []
    let i = 0

    while (i < str.length) {
      // 1. Pre / Code Block ```lang\n...```
      if (str.startsWith('```', i)) {
        const endIdx = str.indexOf('```', i + 3)
        if (endIdx !== -1) {
          const content = str.substring(i + 3, endIdx)
          let lang = ''
          let codeText = content
          const newlineIdx = content.indexOf('\n')
          if (newlineIdx !== -1 && !content.substring(0, newlineIdx).includes(' ')) {
            lang = content.substring(0, newlineIdx).trim()
            codeText = content.substring(newlineIdx + 1)
          }
          const start = output.length
          output += codeText
          localSpans.push({ type: 'pre', start, end: output.length, param: lang })
          i = endIdx + 3
          continue
        }
      }

      // 2. Inline Code `code`
      if (str[i] === '`') {
        const endIdx = str.indexOf('`', i + 1)
        if (endIdx !== -1 && !str.substring(i + 1, endIdx).includes('\n')) {
          const content = str.substring(i + 1, endIdx)
          const start = output.length
          output += content
          localSpans.push({ type: 'code', start, end: output.length })
          i = endIdx + 1
          continue
        }
      }

      // 3. Text Link [text](url)
      if (str[i] === '[') {
        const closeBracket = str.indexOf(']', i + 1)
        if (closeBracket !== -1 && str[closeBracket + 1] === '(') {
          const closeParen = str.indexOf(')', closeBracket + 2)
          if (closeParen !== -1) {
            const linkText = str.substring(i + 1, closeBracket)
            const url = str.substring(closeBracket + 2, closeParen)
            const res = parseTokens(linkText)
            const start = output.length
            output += res.clean
            for (const s of res.spans) {
              localSpans.push({ ...s, start: start + s.start, end: start + s.end })
            }
            localSpans.push({ type: 'text_url', start, end: output.length, param: url })
            i = closeParen + 1
            continue
          }
        }
      }

      // 4. Bold **text**
      if (str.startsWith('**', i)) {
        const endIdx = str.indexOf('**', i + 2)
        if (endIdx !== -1) {
          const inner = str.substring(i + 2, endIdx)
          const res = parseTokens(inner)
          const start = output.length
          output += res.clean
          for (const s of res.spans) {
            localSpans.push({ ...s, start: start + s.start, end: start + s.end })
          }
          localSpans.push({ type: 'bold', start, end: output.length })
          i = endIdx + 2
          continue
        }
      }

      // 5. Italic __text__ or _text_
      if (str.startsWith('__', i)) {
        const endIdx = str.indexOf('__', i + 2)
        if (endIdx !== -1) {
          const inner = str.substring(i + 2, endIdx)
          const res = parseTokens(inner)
          const start = output.length
          output += res.clean
          for (const s of res.spans) {
            localSpans.push({ ...s, start: start + s.start, end: start + s.end })
          }
          localSpans.push({ type: 'italic', start, end: output.length })
          i = endIdx + 2
          continue
        }
      } else if (str[i] === '_' && (i === 0 || str[i - 1] === ' ' || str[i - 1] === '\n')) {
        const endIdx = str.indexOf('_', i + 1)
        if (endIdx !== -1) {
          const inner = str.substring(i + 1, endIdx)
          const res = parseTokens(inner)
          const start = output.length
          output += res.clean
          for (const s of res.spans) {
            localSpans.push({ ...s, start: start + s.start, end: start + s.end })
          }
          localSpans.push({ type: 'italic', start, end: output.length })
          i = endIdx + 1
          continue
        }
      }

      // 6. Spoiler ||text||
      if (str.startsWith('||', i)) {
        const endIdx = str.indexOf('||', i + 2)
        if (endIdx !== -1) {
          const inner = str.substring(i + 2, endIdx)
          const res = parseTokens(inner)
          const start = output.length
          output += res.clean
          for (const s of res.spans) {
            localSpans.push({ ...s, start: start + s.start, end: start + s.end })
          }
          localSpans.push({ type: 'spoiler', start, end: output.length })
          i = endIdx + 2
          continue
        }
      }

      // 7. Strikethrough ~~text~~
      if (str.startsWith('~~', i)) {
        const endIdx = str.indexOf('~~', i + 2)
        if (endIdx !== -1) {
          const inner = str.substring(i + 2, endIdx)
          const res = parseTokens(inner)
          const start = output.length
          output += res.clean
          for (const s of res.spans) {
            localSpans.push({ ...s, start: start + s.start, end: start + s.end })
          }
          localSpans.push({ type: 'strike', start, end: output.length })
          i = endIdx + 2
          continue
        }
      }

      // 8. Underline --text--
      if (str.startsWith('--', i)) {
        const endIdx = str.indexOf('--', i + 2)
        if (endIdx !== -1) {
          const inner = str.substring(i + 2, endIdx)
          const res = parseTokens(inner)
          const start = output.length
          output += res.clean
          for (const s of res.spans) {
            localSpans.push({ ...s, start: start + s.start, end: start + s.end })
          }
          localSpans.push({ type: 'underline', start, end: output.length })
          i = endIdx + 2
          continue
        }
      }

      // Default character
      output += str[i]
      i++
    }

    return { clean: output, spans: localSpans }
  }

  const { clean, spans: rawSpans } = parseTokens(input)

  const entities: raw.base.MessageEntity[] = []
  for (const span of rawSpans) {
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

  return { text: clean, entities }
}
