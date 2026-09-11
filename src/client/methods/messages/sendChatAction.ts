//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { PeerLike } from '../../PeerResolver.js'
import { ChatAction } from '../../../enums/index.js'

export async function sendChatAction(
  this: Client,
  chatId: PeerLike,
  action: ChatAction | string
): Promise<boolean> {
  const peer = await this.peerResolver.resolvePeer(chatId)

  let rawAction: raw.base.SendMessageAction
  switch (action) {
    case ChatAction.TYPING:
    case 'typing':
      rawAction = new raw.types.SendMessageTypingAction()
      break
    case ChatAction.UPLOAD_PHOTO:
    case 'upload_photo':
      rawAction = new raw.types.SendMessageUploadPhotoAction(0)
      break
    case ChatAction.RECORD_VIDEO:
    case 'record_video':
      rawAction = new raw.types.SendMessageRecordVideoAction()
      break
    case ChatAction.UPLOAD_VIDEO:
    case 'upload_video':
      rawAction = new raw.types.SendMessageUploadVideoAction(0)
      break
    case ChatAction.RECORD_AUDIO:
    case 'record_audio':
      rawAction = new raw.types.SendMessageRecordAudioAction()
      break
    case ChatAction.UPLOAD_AUDIO:
    case 'upload_audio':
      rawAction = new raw.types.SendMessageUploadAudioAction(0)
      break
    case ChatAction.UPLOAD_DOCUMENT:
    case 'upload_document':
      rawAction = new raw.types.SendMessageUploadDocumentAction(0)
      break
    case ChatAction.CANCEL:
    case 'cancel':
      rawAction = new raw.types.SendMessageCancelAction()
      break
    default:
      rawAction = new raw.types.SendMessageTypingAction()
  }

  const res = await this.invoke(
    new raw.functions.messages.SetTyping(peer, rawAction)
  )
  return Boolean(res)
}
