// Port of helper/database.py
// Same document structure as MongoDB original:
// user: { _id, file_id, caption, daily, date, uploadlimit, used_limit, usertype, prexdate }
// bot:  { _id, total_rename, total_size }

import fs from 'fs'
import path from 'path'
import { add_date } from './date.js'

const DB_PATH = path.resolve(process.cwd(), 'renamer_db.json')

interface UserDoc {
  _id: number
  file_id: string | null
  caption: string | null
  daily: number
  date: number
  uploadlimit: number
  used_limit: number
  usertype: string
  prexdate: number | null
}

interface BotDoc {
  _id: number
  total_rename: number
  total_size: number
}

interface DB {
  users: UserDoc[]
  bots: BotDoc[]
}

function loadDB(): DB {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as DB
    }
  } catch { }
  return { users: [], bots: [] }
}

function saveDB(db: DB): void {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8') } catch { }
}

// Total users
export function total_user(): number {
  return loadDB().users.length
}

// Insert bot data
export function botdata(chat_id: number): void {
  const db = loadDB()
  if (!db.bots.find(b => b._id === chat_id)) {
    db.bots.push({ _id: chat_id, total_rename: 0, total_size: 0 })
    saveDB(db)
  }
}

export function total_rename(chat_id: number, renamed_file: number): void {
  const db = loadDB()
  const bot = db.bots.find(b => b._id === chat_id)
  if (bot) { bot.total_rename = renamed_file + 1; saveDB(db) }
}

export function total_size(chat_id: number, total_sz: number, now_file_size: number): void {
  const db = loadDB()
  const bot = db.bots.find(b => b._id === chat_id)
  if (bot) { bot.total_size = total_sz + now_file_size; saveDB(db) }
}

// Insert user
export function insert(chat_id: number): boolean {
  const db = loadDB()
  if (db.users.find(u => u._id === chat_id)) return true
  db.users.push({
    _id: chat_id,
    file_id: null,
    caption: null,
    daily: 0,
    date: 0,
    uploadlimit: 2147483648,
    used_limit: 0,
    usertype: 'Free',
    prexdate: null,
  })
  saveDB(db)
  return false
}

export function addthumb(chat_id: number, file_id: string): void {
  const db = loadDB()
  const u = db.users.find(u => u._id === chat_id)
  if (u) { u.file_id = file_id; saveDB(db) }
}

export function delthumb(chat_id: number): void {
  const db = loadDB()
  const u = db.users.find(u => u._id === chat_id)
  if (u) { u.file_id = null; saveDB(db) }
}

export function addcaption(chat_id: number, caption: string): void {
  const db = loadDB()
  const u = db.users.find(u => u._id === chat_id)
  if (u) { u.caption = caption; saveDB(db) }
}

export function delcaption(chat_id: number): void {
  const db = loadDB()
  const u = db.users.find(u => u._id === chat_id)
  if (u) { u.caption = null; saveDB(db) }
}

export function dateupdate(chat_id: number, date: number): void {
  const db = loadDB()
  const u = db.users.find(u => u._id === chat_id)
  if (u) { u.date = date; saveDB(db) }
}

export function used_limit(chat_id: number, used: number): void {
  const db = loadDB()
  const u = db.users.find(u => u._id === chat_id)
  if (u) { u.used_limit = used; saveDB(db) }
}

export function usertype(chat_id: number, type: string): void {
  const db = loadDB()
  const u = db.users.find(u => u._id === chat_id)
  if (u) { u.usertype = type; saveDB(db) }
}

export function uploadlimit(chat_id: number, limit: number): void {
  const db = loadDB()
  const u = db.users.find(u => u._id === chat_id)
  if (u) { u.uploadlimit = limit; saveDB(db) }
}

export function backpre(chat_id: number): void {
  const db = loadDB()
  const u = db.users.find(u => u._id === chat_id)
  if (u) { u.prexdate = null; saveDB(db) }
}

export function addpre(chat_id: number): void {
  const db = loadDB()
  const u = db.users.find(u => u._id === chat_id)
  if (u) { u.prexdate = add_date()[0]; saveDB(db) }
}

export function addpredata(chat_id: number): void {
  const db = loadDB()
  const u = db.users.find(u => u._id === chat_id)
  if (u) { u.prexdate = null; saveDB(db) }
}

export function daily(chat_id: number, date: number): void {
  const db = loadDB()
  const u = db.users.find(u => u._id === chat_id)
  if (u) { u.daily = date; saveDB(db) }
}

// Returns [file_id, caption]
export function find(chat_id: number): [string | null, string | null] {
  const u = loadDB().users.find(u => u._id === chat_id)
  if (!u) return [null, null]
  return [u.file_id ?? null, u.caption ?? null]
}

export function getid(): number[] {
  return loadDB().users.map(u => u._id)
}

export function deleteUser(id: number): void {
  const db = loadDB()
  db.users = db.users.filter(u => u._id !== id)
  saveDB(db)
}

export function find_one(id: number): UserDoc | BotDoc | null {
  const db = loadDB()
  return db.users.find(u => u._id === id) ?? db.bots.find(b => b._id === id) ?? null
}
