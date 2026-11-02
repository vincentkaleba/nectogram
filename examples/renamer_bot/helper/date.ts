// Port of helper/date.py

export function add_date(): [number, string] {
  const today = new Date()
  const ex_date = new Date(today)
  ex_date.setDate(ex_date.getDate() + 90)
  const epcho = Math.floor(ex_date.getTime() / 1000)
  const normal_date = ex_date.toISOString().split('T')[0]
  return [epcho, normal_date]
}

export function check_expi(saved_date: number): boolean {
  const today = new Date()
  const epcho = Math.floor(new Date(today.toISOString().split('T')[0]).getTime() / 1000)
  const then = saved_date - epcho
  return then > 0
}
