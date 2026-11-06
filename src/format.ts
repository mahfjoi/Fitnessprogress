import type { SetEntry } from './types'

export const formatDate = (ts: number) => {
  const d = new Date(ts)
  const today = new Date()
  const days = Math.round(
    (new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000,
  )
  if (days === 0) return 'heute'
  if (days === 1) return 'gestern'
  if (days < 7) return `vor ${days} Tagen`
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export const formatShortDate = (ts: number) =>
  new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })

export const formatKg = (w: number | null) =>
  w === null ? '–' : w.toLocaleString('de-DE', { maximumFractionDigits: 2 })

export const formatSet = (s: SetEntry) =>
  s.weight ? `${formatKg(s.weight)} kg × ${s.reps}` : `${s.reps} Wdh.`

export const formatTimer = (sec: number) => {
  const s = Math.max(0, Math.ceil(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
