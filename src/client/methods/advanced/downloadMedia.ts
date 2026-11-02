//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later
//
//  Parallel media downloader with dedicated MTProto media sessions.
//  Uses Pyrogram's 2-step DC authorization model + media-only endpoints.

import fs from 'fs'
import path from 'path'
import * as raw from '../../../raw/index.js'
import type { Client } from '../../Client.js'
import { Message, Document, Video, Audio, Photo } from '../../../types/index.js'
import { Connection } from '../../../connection/Connection.js'
import { Session } from '../../../session/Session.js'
import { Handshake } from '../../../session/Handshake.js'
import type { AuthKey } from '../../../session/AuthKey.js'

export interface DownloadMediaOptions {
  fileName?: string
  outputDir?: string
  progress?: (current: number, total: number, ...args: any[]) => void | Promise<void>
  progressArgs?: any[]
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CHUNK_SIZE = 1024 * 1024   // 1 MB per chunk
const CHUNK_TIMEOUT_MS = 30_000  // 30 s per chunk timeout
const MAX_RETRIES = 5
const NUM_WORKERS = 2            // 2 dedicated parallel connections per DC

// ── DC Authorization Cache (Pyrogram pattern) ───────────────────────────────
// Map: dcId → AuthKey
const _dcAuthKeys: Map<number, AuthKey> = new Map()

async function getOrExportAuthKeyForDc(client: Client, dcId: number): Promise<AuthKey> {
  const mainDcId = Number(await (client as any).storage?.getDcId?.() ?? 0)
  const mainSession = (client as any).session as Session

  // If target DC is the main DC, reuse mainSession.authKey directly
  if (dcId === mainDcId && mainSession?.authKey) {
    return mainSession.authKey
  }

  // Check if we already created and exported an authKey for this target DC
  if (_dcAuthKeys.has(dcId)) {
    return _dcAuthKeys.get(dcId)!
  }

  // Target DC differs from main DC -> DH Handshake + Export/Import Authorization
  console.log(`[downloadMedia] Authorizing on target DC${dcId} (main=DC${mainDcId})...`)

  const stdConn = new Connection({ dcId, isMedia: false, testMode: (client as any).testMode ?? false })
  await stdConn.connect()

  const hs = new Handshake(stdConn)
  const hsRes = await hs.execute()
  const dcAuthKey = hsRes.authKey

  const stdSession = new Session(stdConn, dcAuthKey, hsRes.serverSalt)
  await stdSession.connect()

  try {
    const exportedAuth: any = await client.invoke(new raw.functions.auth.ExportAuthorization(dcId))
    await stdSession.invoke(new raw.functions.auth.ImportAuthorization(
      BigInt(exportedAuth.id),
      Buffer.isBuffer(exportedAuth.bytes) ? exportedAuth.bytes : Buffer.from(exportedAuth.bytes)
    ))
    console.log(`[downloadMedia] ✅ Authorization successfully imported on DC${dcId}`)
  } catch (err: any) {
    console.warn(`[downloadMedia] Export/Import authorization warning on DC${dcId}: ${err?.message ?? err}`)
  } finally {
    try { stdSession.close() } catch {}
  }

  _dcAuthKeys.set(dcId, dcAuthKey)
  return dcAuthKey
}

// ── Dedicated Worker Sessions per DC ─────────────────────────────────────────
// Key: `${dcId}_${workerIdx}` → Session
const _workerSessions: Map<string, Session | null> = new Map()
const _workerCreating: Map<string, Promise<Session>> = new Map()

async function createWorkerSession(client: Client, dcId: number, workerIdx: number): Promise<Session> {
  const authKey = await getOrExportAuthKeyForDc(client, dcId)

  const conn = new Connection({ dcId, isMedia: true, testMode: (client as any).testMode ?? false })
  await conn.connect()

  const session = new Session(conn, authKey)
  await session.connect()
  session.startPingLoop()

  const key = `${dcId}_${workerIdx}`

  session.on('close', () => {
    if (_workerSessions.get(key) === session) {
      console.warn(`[downloadMedia] DC${dcId} W${workerIdx} session closed — will reconnect on next chunk`)
      _workerSessions.set(key, null)
    }
    try { session.close() } catch {}
  })

  return session
}

async function getWorkerSession(client: Client, dcId: number, workerIdx: number): Promise<Session> {
  const key = `${dcId}_${workerIdx}`
  const existing = _workerSessions.get(key)
  if (existing && existing.isConnected) return existing

  const creating = _workerCreating.get(key)
  if (creating) return await creating

  const creationPromise = (async () => {
    try {
      console.log(`[downloadMedia] Creating dedicated media session DC${dcId} W${workerIdx}...`)
      const session = await createWorkerSession(client, dcId, workerIdx)
      _workerSessions.set(key, session)
      return session
    } finally {
      _workerCreating.delete(key)
    }
  })()

  _workerCreating.set(key, creationPromise)
  return await creationPromise
}

function invalidateWorkerSession(dcId: number, workerIdx: number): void {
  const key = `${dcId}_${workerIdx}`
  const s = _workerSessions.get(key)
  if (s) {
    try { s.close() } catch {}
    _workerSessions.set(key, null)
  }
}

// ── Single chunk download via worker ─────────────────────────────────────────
async function downloadChunkWithWorker(
  client: Client,
  location: raw.base.InputFileLocation,
  dcId: number,
  offsetBytes: number,
  workerIdx: number
): Promise<Buffer> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const session = await getWorkerSession(client, dcId, workerIdx)
      const req = new raw.functions.upload.GetFile(location, BigInt(offsetBytes), CHUNK_SIZE)

      const res: any = await Promise.race([
        session.invoke(req),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`GetFile timeout at offset ${offsetBytes}`)), CHUNK_TIMEOUT_MS)
        )
      ])

      if (!res || !('bytes' in res) || !res.bytes || res.bytes.length === 0) {
        return Buffer.alloc(0) // EOF
      }
      return res.bytes as Buffer

    } catch (err: any) {
      const msg: string = err?.message ?? String(err)
      console.warn(`[downloadMedia] ⚠️ W${workerIdx} offset=${offsetBytes} attempt=${attempt}/${MAX_RETRIES}: ${msg}`)

      invalidateWorkerSession(dcId, workerIdx)

      if (attempt < MAX_RETRIES) {
        const delay = 500 * attempt
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }

  throw new Error(`downloadMedia: chunk at offset ${offsetBytes} failed after ${MAX_RETRIES} attempts`)
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function downloadMedia(
  this: Client,
  messageOrMedia: Message | Document | Video | Audio | Photo | raw.TLObject | any,
  options?: DownloadMediaOptions
): Promise<string | Buffer> {
  let targetMedia: any = messageOrMedia
  const clientRef: Client = this || (targetMedia as any)?._client

  // ── 1. Resolve media from Message ─────────────────────────────────────────
  if (targetMedia instanceof Message) {
    let mediaObj =
      targetMedia.document || targetMedia.video || targetMedia.audio ||
      targetMedia.photo || (targetMedia as any).sticker || (targetMedia as any).animation ||
      (targetMedia as any).voice || (targetMedia as any).videoNote ||
      (targetMedia as any).video_note || targetMedia.raw?.media

    if (!mediaObj && clientRef && typeof clientRef.getMessages === 'function') {
      const idsToFetch: number[] = []
      if (targetMedia.replyToMessageId) idsToFetch.push(targetMedia.replyToMessageId)
      if (targetMedia.id) idsToFetch.push(targetMedia.id)

      const visited = new Set<number>()
      while (idsToFetch.length > 0 && !mediaObj) {
        const nextId = idsToFetch.shift()!
        if (visited.has(nextId)) continue
        visited.add(nextId)
        try {
          const fetched = await clientRef.getMessages(targetMedia.chat.id, [nextId])
          for (const fm of fetched ?? []) {
            if (!fm) continue
            const pm = fm instanceof Message ? fm : Message._parse(fm, undefined, undefined, clientRef)
            const found = pm.document || pm.video || pm.audio || pm.photo ||
              (pm as any).sticker || (pm as any).animation || pm.raw?.media
            if (found) { mediaObj = found; break }
            if (pm.replyToMessageId && !visited.has(pm.replyToMessageId))
              idsToFetch.push(pm.replyToMessageId)
          }
        } catch (err) { console.error('[downloadMedia] Error fetching message:', err) }
      }
    }
    targetMedia = mediaObj
  }

  // ── 2. Resolve location + dc_id + fileSize ────────────────────────────────
  let location: raw.base.InputFileLocation | undefined
  let fileSize = 0
  let suggestedFileName = options?.fileName ?? ''
  let fileDcId = 0
  let docObj: any = null
  let photoObj: any = null

  if (targetMedia instanceof Document || targetMedia instanceof Video || targetMedia instanceof Audio) {
    docObj = targetMedia.raw ?? targetMedia
    if (!suggestedFileName && targetMedia.fileName) suggestedFileName = targetMedia.fileName
    if (targetMedia.fileSize) fileSize = targetMedia.fileSize
  } else if (targetMedia instanceof Photo) {
    photoObj = targetMedia.raw ?? targetMedia
    if (targetMedia.fileSize) fileSize = targetMedia.fileSize
  } else if (targetMedia && typeof targetMedia === 'object') {
    const qual = targetMedia.QUALNAME || targetMedia.constructor?.name || ''
    if (qual.includes('MessageMediaDocument')) {
      docObj = targetMedia.document
    } else if (qual.includes('MessageMediaPhoto')) {
      photoObj = targetMedia.photo
    } else if (qual.includes('Message') && targetMedia.media) {
      const parsed = Message._parse(targetMedia, undefined, undefined, clientRef)
      const inner = parsed.document || parsed.video || parsed.audio || parsed.photo || parsed.raw?.media
      if (inner) {
        if (inner instanceof Document || inner instanceof Video || inner instanceof Audio)
          docObj = inner.raw ?? inner
        else if (inner instanceof Photo) photoObj = inner.raw ?? inner
        else docObj = inner
      }
    } else if (
      qual.includes('Document') ||
      (targetMedia.id !== undefined && (targetMedia.mime_type !== undefined || targetMedia.mimeType !== undefined))
    ) {
      docObj = targetMedia
    } else if (qual.includes('Photo') || (targetMedia.id !== undefined && targetMedia.sizes !== undefined)) {
      photoObj = targetMedia
    }
  }

  if (docObj) {
    const docId = docObj.id ?? docObj.fileId
    const accessHash = docObj.access_hash ?? docObj.accessHash ?? docObj.fileUniqueId ?? 0n
    const fileRef = docObj.file_reference ?? docObj.fileReference ?? Buffer.alloc(0)
    if (docId !== undefined && docId !== null) {
      location = new raw.types.InputDocumentFileLocation(
        BigInt(docId), BigInt(accessHash),
        Buffer.isBuffer(fileRef) ? fileRef : Buffer.from(fileRef), ''
      )
      if (!fileSize) fileSize = Number(docObj.size ?? docObj.fileSize ?? 0)
      fileDcId = Number(docObj.dc_id ?? docObj.dcId ?? 0)
      if (!suggestedFileName && docObj.attributes) {
        for (const attr of docObj.attributes) {
          const aQual = attr?.QUALNAME || attr?.constructor?.name || ''
          if (aQual.includes('DocumentAttributeFilename')) {
            const fname = attr.file_name ?? attr.fileName
            if (fname) { suggestedFileName = fname; break }
          }
        }
      }
    }
  } else if (photoObj) {
    const photoId = photoObj.id ?? photoObj.fileId
    const accessHash = photoObj.access_hash ?? photoObj.accessHash ?? photoObj.fileUniqueId ?? 0n
    const fileRef = photoObj.file_reference ?? photoObj.fileReference ?? Buffer.alloc(0)
    if (photoId !== undefined && photoId !== null) {
      location = new raw.types.InputPhotoFileLocation(
        BigInt(photoId), BigInt(accessHash),
        Buffer.isBuffer(fileRef) ? fileRef : Buffer.from(fileRef), 'y'
      )
      if (!fileSize) fileSize = Number(photoObj.size ?? photoObj.fileSize ?? 0)
      fileDcId = Number(photoObj.dc_id ?? photoObj.dcId ?? 0)
      if (!suggestedFileName) suggestedFileName = `photo_${photoId}.jpg`
    }
  }

  if (!location) {
    throw new Error('downloadMedia: Unable to resolve file location from provided message or media object.')
  }

  const mainDcId = Number(await (clientRef as any).storage?.getDcId?.() ?? 0)
  const targetDc = fileDcId > 0 ? fileDcId : mainDcId
  const safeName = suggestedFileName || `download_${Date.now()}`
  const outDir = options?.outputDir ?? process.cwd()
  const finalPath = path.resolve(outDir, safeName)
  const tempPath = finalPath + '.temp'

  await fs.promises.mkdir(path.dirname(finalPath), { recursive: true })

  console.log(`[downloadMedia] DC=${targetDc} (bot=DC${mainDcId}) workers=${NUM_WORKERS} chunk=${CHUNK_SIZE / 1024}KB timeout=${CHUNK_TIMEOUT_MS / 1000}s`)
  console.log(`[downloadMedia] → ${finalPath} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`)

  // Pre-warm worker sessions before opening file
  await Promise.all(
    Array.from({ length: NUM_WORKERS }, (_, i) => getWorkerSession(clientRef, targetDc, i))
  )

  // ── 3. Parallel worker download streaming to disk ──────────────────────────
  const fileHandle = await fs.promises.open(tempPath, 'w')
  let nextChunkIdx = 0
  let downloadedBytes = 0
  let isEofReached = false
  let lastPct = -1
  const startTime = Date.now()
  const totalChunks = fileSize > 0 ? Math.ceil(fileSize / CHUNK_SIZE) : Infinity

  async function workerTask(workerIdx: number) {
    while (!isEofReached) {
      const chunkIdx = nextChunkIdx++
      if (chunkIdx >= totalChunks) break

      const offsetBytes = chunkIdx * CHUNK_SIZE
      const chunk = await downloadChunkWithWorker(clientRef, location!, targetDc, offsetBytes, workerIdx)

      if (chunk.length === 0) {
        isEofReached = true
        break
      }

      await fileHandle.write(chunk, 0, chunk.length, offsetBytes)

      downloadedBytes += chunk.length

      const pct = fileSize > 0 ? Math.floor((downloadedBytes / fileSize) * 100) : 0
      if (pct !== lastPct && pct % 5 === 0) {
        lastPct = pct
        const elapsed = (Date.now() - startTime) / 1000
        const speedMBps = (downloadedBytes / 1024 / 1024 / elapsed).toFixed(1)
        const mb = (downloadedBytes / 1024 / 1024).toFixed(1)
        const totalMb = fileSize > 0 ? (fileSize / 1024 / 1024).toFixed(1) : '?'
        console.log(`[downloadMedia] ⬇️  ${mb} MB / ${totalMb} MB (${pct}%) @ ${speedMBps} MB/s [W${workerIdx}]`)
      }

      if (options?.progress) {
        Promise.resolve(
          options.progress(downloadedBytes, fileSize || downloadedBytes, ...(options.progressArgs ?? []))
        ).catch(() => {})
      }

      if (chunk.length < CHUNK_SIZE) {
        isEofReached = true
        break
      }
    }
  }

  try {
    const workers = Array.from({ length: NUM_WORKERS }, (_, i) => workerTask(i))
    await Promise.all(workers)
  } catch (err) {
    try { await fileHandle.close() } catch {}
    try { await fs.promises.unlink(tempPath) } catch {}
    throw err
  } finally {
    for (let i = 0; i < NUM_WORKERS; i++) {
      invalidateWorkerSession(targetDc, i)
    }
  }

  await fileHandle.close()
  await fs.promises.rename(tempPath, finalPath)

  const elapsed = (Date.now() - startTime) / 1000
  const avgMBps = (downloadedBytes / 1024 / 1024 / elapsed).toFixed(1)
  console.log(`[downloadMedia] ✅ "${finalPath}" — ${(downloadedBytes / 1024 / 1024).toFixed(1)} MB in ${elapsed.toFixed(1)}s @ ${avgMBps} MB/s`)
  return finalPath
}
