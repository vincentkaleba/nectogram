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

import { parseMarkdown, ParsedText } from './markdown.js'
import { parseHTML } from './html.js'
import { ParseMode } from '../enums/index.js'

export { ParseMode }
export * from './markdown.js'
export * from './html.js'

/**
 * Parse text according to specified ParseMode (markdown, html, or raw).
 */
export function parseText(text: string, parseMode?: ParseMode | string): ParsedText {
  if (!text) return { text: '', entities: [] }
  if (parseMode === 'raw' || parseMode === ParseMode.RAW) return { text, entities: [] }
  if (parseMode === 'html' || parseMode === ParseMode.HTML) return parseHTML(text)
  return parseMarkdown(text)
}

/**
 * Unparse plain text and MTProto entities back to Markdown or HTML formatted string.
 */
export function unparseText(text: string, entities?: any[], parseMode: ParseMode | string = ParseMode.MARKDOWN): string {
  if (!text || !entities || entities.length === 0) return text
  const sorted = [...entities].sort((a, b) => b.offset - a.offset)
  let result = text
  for (const ent of sorted) {
    const start = ent.offset
    const end = ent.offset + ent.length
    const inner = result.substring(start, end)
    let replacement = inner

    if (parseMode === ParseMode.HTML || parseMode === 'html') {
      if (ent.QUALNAME === 'types.MessageEntityBold' || ent.constructor?.name === 'MessageEntityBold') replacement = `<b>${inner}</b>`
      else if (ent.QUALNAME === 'types.MessageEntityItalic' || ent.constructor?.name === 'MessageEntityItalic') replacement = `<i>${inner}</i>`
      else if (ent.QUALNAME === 'types.MessageEntityCode' || ent.constructor?.name === 'MessageEntityCode') replacement = `<code>${inner}</code>`
      else if (ent.QUALNAME === 'types.MessageEntityPre' || ent.constructor?.name === 'MessageEntityPre') replacement = `<pre>${inner}</pre>`
      else if (ent.QUALNAME === 'types.MessageEntityTextUrl' || ent.constructor?.name === 'MessageEntityTextUrl') replacement = `<a href="${ent.url}">${inner}</a>`
      else if (ent.QUALNAME === 'types.MessageEntitySpoiler' || ent.constructor?.name === 'MessageEntitySpoiler') replacement = `<tg-spoiler>${inner}</tg-spoiler>`
      else if (ent.QUALNAME === 'types.MessageEntityStrike' || ent.constructor?.name === 'MessageEntityStrike') replacement = `<s>${inner}</s>`
      else if (ent.QUALNAME === 'types.MessageEntityUnderline' || ent.constructor?.name === 'MessageEntityUnderline') replacement = `<u>${inner}</u>`
      else if (ent.QUALNAME === 'types.MessageEntityBlockquote' || ent.constructor?.name === 'MessageEntityBlockquote') replacement = `<blockquote>${inner}</blockquote>`
      else if (ent.QUALNAME === 'types.MessageEntityCustomEmoji' || ent.constructor?.name === 'MessageEntityCustomEmoji') replacement = `<tg-emoji emoji-id="${ent.document_id}">${inner}</tg-emoji>`
    } else {
      if (ent.QUALNAME === 'types.MessageEntityBold' || ent.constructor?.name === 'MessageEntityBold') replacement = `**${inner}**`
      else if (ent.QUALNAME === 'types.MessageEntityItalic' || ent.constructor?.name === 'MessageEntityItalic') replacement = `__${inner}__`
      else if (ent.QUALNAME === 'types.MessageEntityCode' || ent.constructor?.name === 'MessageEntityCode') replacement = `\`${inner}\``
      else if (ent.QUALNAME === 'types.MessageEntityPre' || ent.constructor?.name === 'MessageEntityPre') replacement = `\`\`\`${inner}\`\`\``
      else if (ent.QUALNAME === 'types.MessageEntityTextUrl' || ent.constructor?.name === 'MessageEntityTextUrl') replacement = `[${inner}](${ent.url})`
      else if (ent.QUALNAME === 'types.MessageEntitySpoiler' || ent.constructor?.name === 'MessageEntitySpoiler') replacement = `||${inner}||`
      else if (ent.QUALNAME === 'types.MessageEntityStrike' || ent.constructor?.name === 'MessageEntityStrike') replacement = `~~${inner}~~`
      else if (ent.QUALNAME === 'types.MessageEntityUnderline' || ent.constructor?.name === 'MessageEntityUnderline') replacement = `--${inner}--`
      else if (ent.QUALNAME === 'types.MessageEntityBlockquote' || ent.constructor?.name === 'MessageEntityBlockquote') replacement = `> ${inner}`
      else if (ent.QUALNAME === 'types.MessageEntityCustomEmoji' || ent.constructor?.name === 'MessageEntityCustomEmoji') replacement = `![${inner}](${ent.document_id})`
    }
    result = result.substring(0, start) + replacement + result.substring(end)
  }
  return result
}
