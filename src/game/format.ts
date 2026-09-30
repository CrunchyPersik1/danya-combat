const SUF = ['', 'К', 'М', 'Б', 'Т', 'Кв', 'Кт', 'Сх', 'Сп', 'Ок', 'Нн', 'Дц']

export function fmt(n: number): string {
  if (n === undefined || n === null || isNaN(n)) return '0'
  if (!isFinite(n)) return '∞'
  if (n < 0) return '-' + fmt(-n)
  if (n < 1000) {
    if (n === Math.floor(n)) return String(n)
    return (Math.round(n * 10) / 10).toFixed(1)
  }
  let i = 0
  let v = n
  while (v >= 1000 && i < SUF.length - 1) { v /= 1000; i++ }
  const s = v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : String(Math.floor(v))
  return s + SUF[i]
}

export function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0
  sec = Math.floor(sec)
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (d > 0) return d + 'д ' + h + 'ч'
  if (h > 0) return h + 'ч ' + m + 'м'
  if (m > 0) return m + 'м ' + s + 'с'
  return s + 'с'
}

export function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v
}

export function rand(a: number, b: number): number {
  return a + Math.random() * (b - a)
}

export function randInt(a: number, b: number): number {
  return Math.floor(rand(a, b + 1))
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
