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

export type FilterFn = (client: any, update: any) => boolean | Promise<boolean>

export interface Filter {
  (client: any, update: any): Promise<boolean>
  and(other: Filter): Filter
  or(other: Filter): Filter
  invert(): Filter
  name?: string
  filterName?: string
}

export function createFilter(func: FilterFn, name?: string): Filter {
  const filter: Filter = async (client: any, update: any): Promise<boolean> => {
    return Boolean(await func(client, update))
  }

  const filterName = name ?? func.name ?? 'CustomFilter'
  try {
    Object.defineProperty(filter, 'name', { value: filterName, writable: true, configurable: true })
  } catch {
    filter.filterName = filterName
  }

  filter.and = (other: Filter): Filter => {
    return createFilter(async (client: any, update: any) => {
      const res = await filter(client, update)
      if (!res) return false
      return await other(client, update)
    }, `(${filter.name} && ${other.name ?? 'Filter'})`)
  }

  filter.or = (other: Filter): Filter => {
    return createFilter(async (client: any, update: any) => {
      const res = await filter(client, update)
      if (res) return true
      return await other(client, update)
    }, `(${filter.name} || ${other.name ?? 'Filter'})`)
  }

  filter.invert = (): Filter => {
    return createFilter(async (client: any, update: any) => {
      const res = await filter(client, update)
      return !res
    }, `!${filter.name}`)
  }

  return filter
}

// Helpers to extract update properties safely
function _senderOf(update: any): any | null {
  if (!update) return null
  if (update.fromUser !== undefined) return update.fromUser
  if (update.from_user !== undefined) return update.from_user
  if (update.user !== undefined) return update.user
  return null
}

function _chatOf(update: any): any | null {
  if (!update) return null
  if (update.chat !== undefined) return update.chat
  return null
}

function _isOutgoing(update: any): boolean {
  if (!update) return false
  return Boolean(update.outgoing)
}

function _messageOf(update: any): any | null {
  if (!update) return null
  if (update.message !== undefined) return update.message
  if (update.text !== undefined || update.photo !== undefined || update.chat !== undefined) return update
  return null
}

export const Filters = {
  /**
   * Filter all updates unconditionally.
   */
  all: createFilter(() => true, 'all'),

  /**
   * Filter updates sent by the current account itself.
   */
  me: createFilter((_, update) => {
    const sender = _senderOf(update)
    return Boolean((sender && sender.isSelf) || _isOutgoing(update))
  }, 'me'),

  /**
   * Filter updates sent by bot accounts.
   */
  bot: createFilter((_, update) => {
    const sender = _senderOf(update)
    return Boolean(sender && sender.isBot)
  }, 'bot'),

  /**
   * Filter incoming updates.
   */
  incoming: createFilter((_, update) => !_isOutgoing(update), 'incoming'),

  /**
   * Filter outgoing updates.
   */
  outgoing: createFilter((_, update) => _isOutgoing(update), 'outgoing'),

  /**
   * Filter text messages.
   */
  text: createFilter((_, update) => {
    const msg = _messageOf(update)
    return Boolean(msg && msg.text && msg.text.length > 0)
  }, 'text'),

  /**
   * Filter messages that are replies to other messages.
   */
  reply: createFilter((_, update) => {
    const msg = _messageOf(update)
    return Boolean(msg && (msg.replyToMessageId || msg.reply_to_message_id))
  }, 'reply'),

  /**
   * Filter forwarded messages.
   */
  forwarded: createFilter((_, update) => {
    const msg = _messageOf(update)
    return Boolean(msg && (msg.forwardOrigin || msg.forward_origin))
  }, 'forwarded'),

  /**
   * Filter media messages containing captions.
   */
  caption: createFilter((_, update) => {
    const msg = _messageOf(update)
    return Boolean(msg && msg.caption)
  }, 'caption'),

  /**
   * Filter photo messages.
   */
  photo: createFilter((_, update) => {
    const msg = _messageOf(update)
    return Boolean(msg && msg.photo)
  }, 'photo'),

  /**
   * Filter video messages.
   */
  video: createFilter((_, update) => {
    const msg = _messageOf(update)
    return Boolean(msg && msg.video)
  }, 'video'),

  /**
   * Filter document messages.
   */
  document: createFilter((_, update) => {
    const msg = _messageOf(update)
    return Boolean(msg && msg.document)
  }, 'document'),

  /**
   * Filter audio messages.
   */
  audio: createFilter((_, update) => {
    const msg = _messageOf(update)
    return Boolean(msg && msg.audio)
  }, 'audio'),

  /**
   * Filter sticker messages.
   */
  sticker: createFilter((_, update) => {
    const msg = _messageOf(update)
    return Boolean(msg && msg.sticker)
  }, 'sticker'),

  /**
   * Filter animation/GIF messages.
   */
  animation: createFilter((_, update) => {
    const msg = _messageOf(update)
    return Boolean(msg && msg.animation)
  }, 'animation'),

  /**
   * Filter voice note messages.
   */
  voice: createFilter((_, update) => {
    const msg = _messageOf(update)
    return Boolean(msg && msg.voice)
  }, 'voice'),

  /**
   * Filter updates in private/direct chats.
   */
  private: createFilter((_, update) => {
    const chat = _chatOf(update)
    return Boolean(chat && (chat.type === 'private' || chat.type === 'bot'))
  }, 'private'),

  /**
   * Filter updates in group or supergroup chats.
   */
  group: createFilter((_, update) => {
    const chat = _chatOf(update)
    return Boolean(chat && (chat.type === 'group' || chat.type === 'supergroup'))
  }, 'group'),

  /**
   * Filter updates in channel chats.
   */
  channel: createFilter((_, update) => {
    const chat = _chatOf(update)
    return Boolean(chat && chat.type === 'channel')
  }, 'channel'),

  /**
   * Filter command messages (e.g. /start, !help).
   * Stores matched command and arguments in `message.command`.
   */
  command: (
    commands: string | string[],
    prefixes: string | string[] = '/',
    caseSensitive: boolean = false,
  ): Filter => {
    const cmdList = Array.isArray(commands) ? commands : [commands]
    const normalizedCmds = new Set(cmdList.map((c) => (caseSensitive ? c : c.toLowerCase())))
    const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes]

    return createFilter((client, update) => {
      const msg = _messageOf(update)
      if (!msg) return false

      const text: string | undefined = msg.text || msg.caption
      if (!text) return false

      let matchedPrefix: string | null = null
      for (const prefix of prefixList) {
        if (text.startsWith(prefix)) {
          matchedPrefix = prefix
          break
        }
      }

      if (matchedPrefix === null) return false

      const withoutPrefix = text.substring(matchedPrefix.length)
      const botUsername = client?.me?.username ? client.me.username.toLowerCase() : ''

      const spaceIndex = withoutPrefix.search(/\s/)
      const firstWord = spaceIndex === -1 ? withoutPrefix : withoutPrefix.substring(0, spaceIndex)
      const restText = spaceIndex === -1 ? '' : withoutPrefix.substring(spaceIndex).trim()

      let rawCmd = firstWord
      if (rawCmd.includes('@')) {
        const [cmdName, targetBot] = rawCmd.split('@')
        if (botUsername && targetBot.toLowerCase() !== botUsername) {
          return false
        }
        rawCmd = cmdName
      }

      const lookupCmd = caseSensitive ? rawCmd : rawCmd.toLowerCase()
      if (!normalizedCmds.has(lookupCmd)) return false

      const args: string[] = []
      if (restText) {
        const argRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|(\S+)/g
        let match: RegExpExecArray | null
        while ((match = argRegex.exec(restText)) !== null) {
          const val = match[1] ?? match[2] ?? match[3] ?? ''
          args.push(val.replace(/\\(["'])/g, '$1'))
        }
      }

      msg.command = [rawCmd, ...args]
      return true
    }, `command(${cmdList.join(',')})`)
  },

  /**
   * Filter updates matching a regular expression pattern.
   * Stores matches array in `update.matches`.
   */
  regex: (pattern: string | RegExp, flags?: string): Filter => {
    const rgx = typeof pattern === 'string' ? new RegExp(pattern, flags) : pattern

    return createFilter((_, update) => {
      let value: string | undefined

      if (update.text !== undefined || update.caption !== undefined) {
        value = update.text || update.caption
      } else if (update.data !== undefined) {
        value = update.data
      } else if (update.query !== undefined) {
        value = update.query
      }

      if (!value) return false

      const matches = Array.from(value.matchAll(new RegExp(rgx.source, rgx.flags.includes('g') ? rgx.flags : rgx.flags + 'g')))
      if (matches.length > 0) {
        update.matches = matches
        return true
      }
      return false
    }, `regex(${rgx.source})`)
  },

  /**
   * Filter updates sent by specific user IDs or usernames.
   */
  user: (users: bigint | number | string | (bigint | number | string)[]): Filter => {
    const userList = Array.isArray(users) ? users : [users]
    const ids = new Set<bigint>()
    const usernames = new Set<string>()
    let includeMe = false

    for (const u of userList) {
      if (typeof u === 'string') {
        const clean = u.toLowerCase().replace(/^@/, '')
        if (clean === 'me' || clean === 'self') {
          includeMe = true
        } else {
          usernames.add(clean)
        }
      } else {
        ids.add(BigInt(u))
      }
    }

    return createFilter((_, update) => {
      const sender = _senderOf(update)
      if (!sender) return false

      if (includeMe && sender.isSelf) return true
      if (sender.id && ids.has(BigInt(sender.id))) return true
      if (sender.username && usernames.has(sender.username.toLowerCase())) return true

      return false
    }, 'user(...)')
  },

  /**
   * Filter updates coming from specific chat IDs or usernames.
   */
  chat: (chats: bigint | number | string | (bigint | number | string)[]): Filter => {
    const chatList = Array.isArray(chats) ? chats : [chats]
    const ids = new Set<bigint>()
    const usernames = new Set<string>()
    let includeMe = false

    for (const c of chatList) {
      if (typeof c === 'string') {
        const clean = c.toLowerCase().replace(/^@/, '')
        if (clean === 'me' || clean === 'self') {
          includeMe = true
        } else {
          usernames.add(clean)
        }
      } else {
        ids.add(BigInt(c))
      }
    }

    return createFilter((_, update) => {
      const chat = _chatOf(update)
      if (!chat) return false

      const sender = _senderOf(update)
      if (includeMe && sender && sender.isSelf && chat.id === sender.id) return true
      if (chat.id && ids.has(BigInt(chat.id))) return true
      if (chat.username && usernames.has(chat.username.toLowerCase())) return true

      return false
    }, 'chat(...)')
  },
}
