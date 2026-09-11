//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import type { Client } from '../../Client.js'

export class StopTransmissionError extends Error {
  constructor(message: string = 'Stop transmission') {
    super(message)
    this.name = 'StopTransmissionError'
  }
}

export function stopTransmission(): never {
  throw new StopTransmissionError()
}

export async function idle(): Promise<void> {
  return new Promise<void>((resolve) => {
    const shutdown = () => {
      process.off('SIGINT', shutdown)
      process.off('SIGTERM', shutdown)
      resolve()
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  })
}

export async function compose(
  clients: Client[],
  sequential: boolean = false
): Promise<void> {
  if (sequential) {
    for (const c of clients) {
      await c.start()
    }
  } else {
    await Promise.all(clients.map((c) => c.start()))
  }

  await idle()

  if (sequential) {
    for (const c of clients) {
      await c.stop()
    }
  } else {
    await Promise.all(clients.map((c) => c.stop()))
  }
}
