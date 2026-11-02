// Port of helper/progress.py

export function humanbytes(size: number): string {
  if (!size) return ''
  const power = 1024
  let n = 0
  const dic: Record<number, string> = { 0: ' ', 1: 'Ki', 2: 'Mi', 3: 'Gi', 4: 'Ti' }
  while (size > power) {
    size /= power
    n++
  }
  return String(Math.round(size * 100) / 100) + ' ' + dic[n] + 'B'
}

export function TimeFormatter(milliseconds: number): string {
  let ms = Math.floor(milliseconds)
  const seconds_total = Math.floor(ms / 1000); ms = ms % 1000
  const minutes_total = Math.floor(seconds_total / 60); const seconds = seconds_total % 60
  const hours_total = Math.floor(minutes_total / 60); const minutes = minutes_total % 60
  const days = Math.floor(hours_total / 24); const hours = hours_total % 24
  let tmp = ''
  if (days)    tmp += days    + 'd, '
  if (hours)   tmp += hours   + 'h, '
  if (minutes) tmp += minutes + 'm, '
  if (seconds) tmp += seconds + 's, '
  if (ms)      tmp += ms      + 'ms, '
  return tmp.slice(0, -2)
}

export async function progress_for_pyrogram(
  current: number,
  total: number,
  ud_type: string,
  message: { edit: (text: string) => Promise<any> },
  start: number
): Promise<void> {
  const now = Date.now() / 1000
  const lastUpdate = (message as any)._lastProgressUpdate ?? 0
  const isUpdating = (message as any)._isUpdating ?? false

  if ((now - lastUpdate >= 4 || current === total) && !isUpdating) {
    (message as any)._lastProgressUpdate = now
    ;(message as any)._isUpdating = true

    const diff = Math.max(now - start, 0.1)
    const percentage = (current * 100) / total
    const speed = current / diff
    const elapsed_time = Math.round(diff) * 1000
    const time_to_completion = Math.round((total - current) / Math.max(speed, 1)) * 1000
    const estimated_total_time = elapsed_time + time_to_completion

    const elapsed_str = TimeFormatter(elapsed_time)
    const eta_str = TimeFormatter(estimated_total_time)

    const bars = Math.floor(percentage / 5)
    const progress =
      '[' + '●'.repeat(bars) + '○'.repeat(20 - bars) + '] \n' +
      `**Progress**: ${Math.round(percentage * 100) / 100}%\n`

    const tmp =
      progress +
      `${humanbytes(current)} of ${humanbytes(total)}\n` +
      `**Speed**: ${humanbytes(speed)}/s\n` +
      `**ETA**: ${eta_str || '0 s'}\n`

    try {
      await message.edit(`${ud_type}\n ${tmp}`)
    } catch {
    } finally {
      ;(message as any)._isUpdating = false
    }
  }
}
