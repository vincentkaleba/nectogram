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

/**
 * High-level Enum for Telegram Parse Modes.
 */
export enum ParseMode {
  MARKDOWN = 'markdown',
  HTML = 'html',
  RAW = 'raw',
}

/**
 * High-level Enum for Telegram Chat Types.
 */
export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group',
  SUPERGROUP = 'supergroup',
  CHANNEL = 'channel',
}

/**
 * High-level Enum for Message Entity Types.
 */
export enum MessageEntityType {
  BOLD = 'bold',
  ITALIC = 'italic',
  CODE = 'code',
  PRE = 'pre',
  TEXT_URL = 'text_url',
  MENTION = 'mention',
  HASHTAG = 'hashtag',
  BOT_COMMAND = 'bot_command',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
  CASHTAG = 'cashtag',
  UNDERLINE = 'underline',
  STRIKE = 'strike',
  BLOCKQUOTE = 'blockquote',
  SPOILER = 'spoiler',
  CUSTOM_EMOJI = 'custom_emoji',
  FORMATTED_DATE = 'formatted_date',
}

/**
 * High-level Enum for Telegram Button Styles (Colors).
 */
export enum ButtonStyle {
  PRIMARY = 'primary',
  DANGER = 'danger',
  SUCCESS = 'success',
}

/**
 * High-level Enum for Telegram Inline Button Action Types.
 */
export enum InlineButtonActionType {
  CALLBACK = 'callback',
  URL = 'url',
  WEB_APP = 'web_app',
  SWITCH_INLINE = 'switch_inline',
  COPY = 'copy',
  BUY = 'buy',
  USER_PROFILE = 'user_profile',
}
