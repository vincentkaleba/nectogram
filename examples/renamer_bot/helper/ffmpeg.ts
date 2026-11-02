// Port of helper/ffmpeg.py

import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execFileAsync = promisify(execFile)

export async function take_screen_shot(video_file: string, output_directory: string, ttl: number): Promise<string | null> {
  const out_put_file_name = path.join(output_directory, `${Date.now()}.jpg`)
  const file_generator_command = [
    '-ss', String(ttl),
    '-i', video_file,
    '-vframes', '1',
    out_put_file_name,
  ]
  try {
    await execFileAsync('ffmpeg', file_generator_command)
  } catch { }
  if (fs.existsSync(out_put_file_name)) {
    return out_put_file_name
  }
  return null
}

export async function fix_thumb(thumb: string | null): Promise<[number, number, string | null]> {
  let width = 0
  let height = 0
  if (!thumb) return [width, height, null]
  try {
    // Use ffprobe to get dimensions
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-of', 'csv=p=0',
      thumb,
    ])
    const parts = stdout.trim().split(',')
    if (parts.length >= 2) {
      width = parseInt(parts[0], 10) || 0
      height = parseInt(parts[1], 10) || 0
    }
  } catch (e) {
    console.log(e)
    return [0, 0, null]
  }
  return [width, height, thumb]
}
