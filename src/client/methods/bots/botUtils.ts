//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'

export interface BotCommandInput {
  command: string
  description: string
}

export async function setBotCommands(
  this: Client,
  commands: BotCommandInput[],
  options?: {
    scope?: raw.base.BotCommandScope
    langCode?: string
  }
): Promise<boolean> {
  const botCommands = commands.map(
    (c) => new raw.types.BotCommand(c.command.replace(/^\//, ''), c.description)
  )
  const scope = options?.scope ?? new raw.types.BotCommandScopeDefault()
  const langCode = options?.langCode ?? ''

  const res = await this.invoke(
    new raw.functions.bots.SetBotCommands(scope, langCode, botCommands)
  )
  return Boolean(res)
}

export async function getBotCommands(
  this: Client,
  options?: {
    scope?: raw.base.BotCommandScope
    langCode?: string
  }
): Promise<BotCommandInput[]> {
  const scope = options?.scope ?? new raw.types.BotCommandScopeDefault()
  const langCode = options?.langCode ?? ''

  const res = await this.invoke(
    new raw.functions.bots.GetBotCommands(scope, langCode)
  )

  if (Array.isArray(res)) {
    return res.map((c) => ({
      command: c.command,
      description: c.description,
    }))
  }
  return []
}

export async function deleteBotCommands(
  this: Client,
  options?: {
    scope?: raw.base.BotCommandScope
    langCode?: string
  }
): Promise<boolean> {
  const scope = options?.scope ?? new raw.types.BotCommandScopeDefault()
  const langCode = options?.langCode ?? ''

  const res = await this.invoke(
    new raw.functions.bots.ResetBotCommands(scope, langCode)
  )
  return Boolean(res)
}
