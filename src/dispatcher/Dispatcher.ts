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
import { Message, CallbackQuery } from '../types/index.js'
import { Handler, MessageHandler, CallbackQueryHandler, RawUpdateHandler, ErrorHandler } from './handlers/index.js'
import { StopPropagation, ContinuePropagation } from './errors.js'

export type UpdatePacket = [rawUpdate: any, users: Map<bigint, any>, chats: Map<bigint, any>]

export class Dispatcher {
  public client: any
  public readonly groups: Map<number, Handler[]> = new Map()

  private _updatesQueue: UpdatePacket[] = []
  private _isProcessing: boolean = false
  private _stopped: boolean = false

  constructor(client: any) {
    this.client = client
  }

  /**
   * Register a new update handler to a priority group (default = 0).
   */
  public addHandler(handler: Handler, group: number = 0): void {
    if (!this.groups.has(group)) {
      this.groups.set(group, [])
      // Sort groups by priority ascending (e.g. -1, 0, 1, 2...)
      const sortedEntries = Array.from(this.groups.entries()).sort(([a], [b]) => a - b)
      this.groups.clear()
      for (const [gKey, gHandlers] of sortedEntries) {
        this.groups.set(gKey, gHandlers)
      }
    }
    this.groups.get(group)!.push(handler)
  }

  /**
   * Remove a registered handler from a priority group.
   */
  public removeHandler(handler: Handler, group: number = 0): void {
    const list = this.groups.get(group)
    if (!list) return
    const index = list.indexOf(handler)
    if (index !== -1) {
      list.splice(index, 1)
      if (list.length === 0) {
        this.groups.delete(group)
      }
    }
  }

  /**
   * Feed an incoming raw update with user and chat dictionaries into the dispatch queue.
   */
  public feedUpdate(update: any, users: Map<bigint, any> = new Map(), chats: Map<bigint, any> = new Map()): void {
    if (this._stopped) return
    this._updatesQueue.push([update, users, chats])
    setImmediate(() => {
      this.processQueue().catch((err) => {
        console.error('Dispatcher queue processing error:', err)
      })
    })
  }

  /**
   * Start processing incoming update queue.
   */
  public start(): void {
    this._stopped = false
    setImmediate(() => {
      this.processQueue().catch((err) => {
        console.error('Dispatcher queue processing error:', err)
      })
    })
  }

  /**
   * Stop the dispatcher and clear pending update queues.
   */
  public stop(clearHandlers: boolean = false): void {
    this._stopped = true
    this._updatesQueue = []
    if (clearHandlers) {
      this.groups.clear()
    }
  }

  private async processQueue(): Promise<void> {
    if (this._isProcessing || this._stopped) return
    this._isProcessing = true

    try {
      while (this._updatesQueue.length > 0 && !this._stopped) {
        const packet = this._updatesQueue.shift()
        if (!packet) continue
        const [update, users, chats] = packet
        await this.handleUpdate(update, users, chats)
      }
    } finally {
      this._isProcessing = false
    }
  }

  /**
   * Core update router matching raw updates to high-level types, evaluating filters, and executing callbacks.
   */
  public async handleUpdate(update: any, users: Map<bigint, any>, chats: Map<bigint, any>): Promise<void> {
    const { parsedUpdate, handlerClass } = this.parseUpdate(update, users, chats)

    try {
      for (const groupHandlers of this.groups.values()) {
        for (const handler of groupHandlers) {
          if (handler instanceof ErrorHandler) {
            continue
          }

          let matched = false
          let checkResult = false

          if (handlerClass && handler instanceof handlerClass && parsedUpdate) {
            checkResult = await handler.check(this.client, parsedUpdate)
            if (checkResult) {
              matched = true
              try {
                await handler.callback(this.client, parsedUpdate)
              } catch (err: any) {
                if (err instanceof StopPropagation) {
                  throw err
                } else if (err instanceof ContinuePropagation) {
                  // Continue to next handler in same loop
                  continue
                } else {
                  await this.handleException(err, handler, update, users, chats)
                }
              }
            }
          } else if (handler instanceof RawUpdateHandler) {
            checkResult = await handler.check(this.client, update)
            if (checkResult) {
              matched = true
              try {
                await handler.callback(this.client, update, users, chats)
              } catch (err: any) {
                if (err instanceof StopPropagation) {
                  throw err
                } else if (err instanceof ContinuePropagation) {
                  continue
                } else {
                  await this.handleException(err, handler, update, users, chats)
                }
              }
            }
          }

          if (matched) {
            // Once a handler in this group handles the update, move to next group (Pyrogram default logic)
            break
          }
        }
      }
    } catch (err: any) {
      if (err instanceof StopPropagation) {
        // Stop propagation completely across all groups
        return
      }
    }
  }

  private parseUpdate(update: any, users: Map<bigint, any>, chats: Map<bigint, any>): { parsedUpdate: any; handlerClass?: any } {
    if (!update) return { parsedUpdate: null }

    if (
      update instanceof raw.types.UpdateNewMessage ||
      update instanceof raw.types.UpdateNewChannelMessage ||
      update instanceof raw.types.UpdateNewScheduledMessage ||
      update instanceof raw.types.UpdateEditMessage ||
      update instanceof raw.types.UpdateEditChannelMessage
    ) {
      if (update.message && update.message instanceof raw.types.Message) {
        const parsed = Message._parse(update.message, users, chats)
        return { parsedUpdate: parsed, handlerClass: MessageHandler }
      }
    } else if (update instanceof raw.types.UpdateBotCallbackQuery || update instanceof raw.types.UpdateInlineBotCallbackQuery) {
      const parsed = CallbackQuery._parse(update as any, users)
      return { parsedUpdate: parsed, handlerClass: CallbackQueryHandler }
    }

    return { parsedUpdate: null }
  }

  private async handleException(err: Error, handler: Handler, update: any, users: Map<bigint, any>, chats: Map<bigint, any>): Promise<void> {
    let handled = false
    for (const groupHandlers of this.groups.values()) {
      for (const h of groupHandlers) {
        if (h instanceof ErrorHandler && h.matchesError(err)) {
          try {
            await h.callback(this.client, err, handler, update, users, chats)
            handled = true
          } catch (err2) {
            if (err2 instanceof StopPropagation) {
              return
            }
          }
          break
        }
      }
      if (handled) break
    }

    if (!handled) {
      console.error(`Unhandled exception in ${handler.constructor.name}:`, err)
    }
  }
}
