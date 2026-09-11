//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'
import { Message } from '../../../types/index.js'
import { parseText } from '../../../parser/index.js'

export async function sendLocation(
  this: Client,
  chatId: PeerLike,
  latitude: number,
  longitude: number
): Promise<Message> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const randomId = BigInt(Math.floor(Math.random() * 1e12))
  const media = new raw.types.InputMediaGeoPoint(new raw.types.InputGeoPoint(latitude, longitude))

  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      media,
      '',
      randomId
    )
  )
  return Message._parse(res as any)
}

export async function sendContact(
  this: Client,
  chatId: PeerLike,
  phoneNumber: string,
  firstName: string,
  lastName: string = ''
): Promise<Message> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const randomId = BigInt(Math.floor(Math.random() * 1e12))
  const media = new raw.types.InputMediaContact(phoneNumber, firstName, lastName, '')

  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      media,
      '',
      randomId
    )
  )
  return Message._parse(res as any)
}

export async function sendDice(
  this: Client,
  chatId: PeerLike,
  emoji: string = '🎲'
): Promise<Message> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const randomId = BigInt(Math.floor(Math.random() * 1e12))
  const media = new raw.types.InputMediaDice(emoji)

  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      media,
      '',
      randomId
    )
  )
  return Message._parse(res as any)
}

export async function sendPoll(
  this: Client,
  chatId: PeerLike,
  question: string,
  options: string[],
  pollOptions?: {
    isAnonymous?: boolean
    allowsMultipleAnswers?: boolean
    isQuiz?: boolean
    correctOptionId?: number
  }
): Promise<Message> {
  const peer = await this.peerResolver.resolvePeer(chatId)
  const randomId = BigInt(Math.floor(Math.random() * 1e12))

  const pollAnswers = options.map((text, idx) => 
    new raw.types.PollAnswer(new raw.types.TextWithEntities(text, []), Buffer.from([idx]))
  )

  const poll = new raw.types.Poll(
    0n,
    new raw.types.TextWithEntities(question, []),
    pollAnswers,
    0n,
    false,
    pollOptions?.isAnonymous ?? true,
    pollOptions?.allowsMultipleAnswers ?? false,
    pollOptions?.isQuiz ?? false
  )

  const media = new raw.types.InputMediaPoll(poll, pollOptions?.correctOptionId !== undefined ? [pollOptions.correctOptionId] : undefined)

  const res = await this.invoke(
    new raw.functions.messages.SendMedia(
      peer,
      media,
      '',
      randomId
    )
  )
  return Message._parse(res as any)
}
