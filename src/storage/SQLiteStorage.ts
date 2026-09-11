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

import DatabaseConstructor, { type Database } from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Storage, PeerInfo } from './Storage.js'
import { AuthKey } from '../session/AuthKey.js'

// ---------------------------------------------------------------------------
//  DDL
//  The `sessions` table has a single row with id=1. dc_id is just a regular
//  column (not the PK) so setDcId is a plain UPDATE with no row migration.
// ---------------------------------------------------------------------------
const SCHEMA = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  dc_id      INTEGER NOT NULL DEFAULT 2,
  api_id     INTEGER,
  test_mode  INTEGER NOT NULL DEFAULT 0,
  auth_key   BLOB,
  date       INTEGER NOT NULL DEFAULT 0,
  user_id    TEXT,
  is_bot     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS peers (
  id             TEXT    PRIMARY KEY,
  access_hash    TEXT    NOT NULL DEFAULT '0',
  type           TEXT    NOT NULL,
  phone_number   TEXT,
  first_name     TEXT,
  last_name      TEXT,
  title          TEXT,
  username       TEXT,
  last_update_on INTEGER NOT NULL DEFAULT (CAST(STRFTIME('%s','now') AS INTEGER))
);

CREATE TABLE IF NOT EXISTS usernames (
  id       TEXT NOT NULL,
  username TEXT NOT NULL,
  FOREIGN KEY (id) REFERENCES peers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_peers_phone        ON peers (phone_number);
CREATE INDEX IF NOT EXISTS idx_peers_username     ON peers (username);
CREATE INDEX IF NOT EXISTS idx_usernames_id       ON usernames (id);
CREATE INDEX IF NOT EXISTS idx_usernames_username ON usernames (username);
`

const USERNAME_TTL = 8 * 60 * 60 // 8 h

// ---------------------------------------------------------------------------

export class SQLiteStorage extends Storage {
  public readonly filePath: string | ':memory:'

  private _db!: Database
  private _opened = false

  constructor(nameOrPath: string, inMemory = false) {
    super()
    if (inMemory) {
      this.filePath = ':memory:'
    } else {
      const p = nameOrPath.endsWith('.session') ? nameOrPath : `${nameOrPath}.session`
      this.filePath = resolve(p)
    }
  }

  // -------------------------------------------------------------------------
  //  Internal: ensure DB is open. Re-opens if closed (e.g. after disconnect).
  // -------------------------------------------------------------------------
  private _ensureOpen(): void {
    if (!this._db || this._db.open === false) {
      if (this.filePath !== ':memory:') {
        mkdirSync(dirname(this.filePath), { recursive: true })
      }
      this._db = new DatabaseConstructor(this.filePath)
      this._db.exec(SCHEMA)
      // Ensure exactly one session row
      const exists = this._db.prepare('SELECT id FROM sessions WHERE id = 1').get()
      if (!exists) {
        this._db.prepare('INSERT INTO sessions (id) VALUES (1)').run()
      }
    }
  }

  // -------------------------------------------------------------------------
  //  Lifecycle
  // -------------------------------------------------------------------------

  public override async open(): Promise<void> {
    if (this._opened) {
      this._ensureOpen()
      return
    }
    this._opened = true
    this._ensureOpen()
  }

  public override async save(): Promise<void> {
    if (this._db?.open) {
      this._db.pragma('wal_checkpoint(PASSIVE)')
    }
  }

  public override async close(): Promise<void> {
    // Do NOT close the SQLite connection — it needs to persist across
    // DC migrations (disconnect + reconnect). We only truly close on process exit.
    // This matches how Pyrogram keeps the connection open throughout session lifetime.
  }

  public override async delete(): Promise<void> {
    if (this._db?.open) {
      this._db.close()
    }
    if (this.filePath !== ':memory:') {
      const { unlinkSync } = await import('node:fs')
      try { unlinkSync(this.filePath as string) } catch {}
      try { unlinkSync((this.filePath as string) + '-shm') } catch {}
      try { unlinkSync((this.filePath as string) + '-wal') } catch {}
    }
  }

  // -------------------------------------------------------------------------
  //  Session property helpers — always operate on the single row (id=1)
  // -------------------------------------------------------------------------

  private _get<T>(col: string): T | null {
    this._ensureOpen()
    const row = this._db.prepare(`SELECT ${col} FROM sessions WHERE id = 1`).get() as any
    return row != null ? row[col] : null
  }

  private _set(col: string, value: unknown): void {
    this._ensureOpen()
    this._db.prepare(`UPDATE sessions SET ${col} = ? WHERE id = 1`).run(value as any)
  }

  // -------------------------------------------------------------------------
  //  Session API
  // -------------------------------------------------------------------------

  public override async getDcId(): Promise<number> {
    return (this._get<number>('dc_id')) ?? 2
  }

  public override async setDcId(val: number): Promise<void> {
    this._set('dc_id', val)
  }

  public override async getApiId(): Promise<number> {
    return (this._get<number>('api_id')) ?? 0
  }

  public override async setApiId(val: number): Promise<void> {
    this._set('api_id', val)
  }

  public override async getTestMode(): Promise<boolean> {
    return Boolean(this._get<number>('test_mode'))
  }

  public override async setTestMode(val: boolean): Promise<void> {
    this._set('test_mode', val ? 1 : 0)
  }

  public override async getAuthKey(): Promise<AuthKey | null> {
    const blob = this._get<Buffer>('auth_key')
    if (!blob) return null
    return new AuthKey(Buffer.from(blob))
  }

  public override async setAuthKey(val: AuthKey | null): Promise<void> {
    this._set('auth_key', val ? val.key : null)
  }

  public override async getUserId(): Promise<bigint | null> {
    const raw = this._get<string>('user_id')
    return raw != null ? BigInt(raw) : null
  }

  public override async setUserId(val: bigint | null): Promise<void> {
    this._set('user_id', val != null ? val.toString() : null)
  }

  public override async getIsBot(): Promise<boolean> {
    return Boolean(this._get<number>('is_bot'))
  }

  public override async setIsBot(val: boolean): Promise<void> {
    this._set('is_bot', val ? 1 : 0)
  }

  // -------------------------------------------------------------------------
  //  Peer cache API
  // -------------------------------------------------------------------------

  public override async updatePeer(peer: PeerInfo): Promise<void> {
    this._ensureOpen()
    const id = peer.id.toString()
    const hash = peer.accessHash.toString()

    this._db.prepare(`
      INSERT INTO peers (id, access_hash, type, phone_number, first_name, last_name, title, username)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        access_hash    = excluded.access_hash,
        type           = excluded.type,
        phone_number   = COALESCE(excluded.phone_number,  peers.phone_number),
        first_name     = COALESCE(excluded.first_name,    peers.first_name),
        last_name      = COALESCE(excluded.last_name,     peers.last_name),
        title          = COALESCE(excluded.title,         peers.title),
        username       = COALESCE(excluded.username,      peers.username),
        last_update_on = CAST(STRFTIME('%s','now') AS INTEGER)
    `).run(id, hash, peer.type, peer.phone ?? null, peer.firstName ?? null, peer.lastName ?? null, peer.title ?? null, peer.username ? peer.username.toLowerCase() : null)

    if (peer.username) {
      this._db.prepare('DELETE FROM usernames WHERE id = ?').run(id)
      this._db.prepare('INSERT INTO usernames (id, username) VALUES (?, ?)').run(id, peer.username.toLowerCase())
    }
  }

  public override async getPeerById(id: bigint): Promise<PeerInfo | null> {
    this._ensureOpen()
    const row = this._db.prepare(`
      SELECT id, access_hash, type, phone_number, first_name, last_name, title, username
      FROM peers WHERE id = ?
    `).get(id.toString()) as any
    if (!row) return null
    return this._rowToPeerInfo(row)
  }

  public override async getPeerByUsername(username: string): Promise<PeerInfo | null> {
    this._ensureOpen()
    const lower = username.toLowerCase()
    const row = this._db.prepare(`
      SELECT p.id, p.access_hash, p.type, p.phone_number, p.first_name, p.last_name, p.title, p.username, p.last_update_on
      FROM peers p
      JOIN usernames u ON p.id = u.id
      WHERE u.username = ?
      ORDER BY p.last_update_on DESC
      LIMIT 1
    `).get(lower) as any
    if (!row) return null
    if (Math.abs(Date.now() / 1000 - row.last_update_on) > USERNAME_TTL) return null
    return this._rowToPeerInfo(row)
  }

  public override async getPeerByPhone(phone: string): Promise<PeerInfo | null> {
    this._ensureOpen()
    const row = this._db.prepare(`
      SELECT id, access_hash, type, phone_number, first_name, last_name, title, username
      FROM peers WHERE phone_number = ?
    `).get(phone) as any
    if (!row) return null
    return this._rowToPeerInfo(row)
  }

  // -------------------------------------------------------------------------
  //  Internal helpers
  // -------------------------------------------------------------------------

  private _rowToPeerInfo(row: any): PeerInfo {
    return {
      id: BigInt(row.id),
      accessHash: BigInt(row.access_hash ?? 0),
      type: row.type,
      phone: row.phone_number ?? undefined,
      firstName: row.first_name ?? undefined,
      lastName: row.last_name ?? undefined,
      title: row.title ?? undefined,
      username: row.username ?? undefined,
    }
  }
}
