import type { AppData, PlanDay, PlanItem } from './types'
import { ensureExercise, uid } from './store'

export interface ImportedItem {
  exercise: string
  sets: number
  targetReps: string
  restSec: number
}

export interface ImportedDay {
  name: string
  items: ImportedItem[]
}

/**
 * Liest einen Plan im Textformat:
 *
 *   Tag: Tag 1
 *   Bankdrücken | 3 | 8-10 | 120
 *   Klimmzüge | 3 | 6-8
 *
 * Spalten: Übung | Sätze | Wiederholungen | Pause in Sekunden (die letzten drei optional).
 * Trennzeichen: | oder ;  –  Zeilen mit # sind Kommentare.
 */
export function parsePlanText(text: string): ImportedDay[] {
  const days: ImportedDay[] = []
  let current: ImportedDay | null = null

  text.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || line.startsWith('//')) return

    const dayMatch = line.match(/^(?:tag|day|training)\s*:\s*(.+)$/i)
    if (dayMatch) {
      current = { name: dayMatch[1].trim(), items: [] }
      days.push(current)
      return
    }

    const parts = line.split(/[|;]/).map((p) => p.trim())
    const name = parts[0]
    if (!name) throw new Error(`Zeile ${i + 1}: Übungsname fehlt`)
    if (!current) {
      current = { name: 'Importierter Tag', items: [] }
      days.push(current)
    }

    const sets = parts[1] ? parseInt(parts[1]) : 3
    if (!Number.isFinite(sets) || sets < 1 || sets > 20) throw new Error(`Zeile ${i + 1}: ungültige Satzanzahl „${parts[1]}“`)
    const rest = parts[3] ? parseInt(parts[3]) : 90
    if (!Number.isFinite(rest) || rest < 0) throw new Error(`Zeile ${i + 1}: ungültige Pause „${parts[3]}“`)

    current.items.push({ exercise: name, sets, targetReps: (parts[2] ?? '').replace(/–/g, '-'), restSec: rest })
  })

  if (days.length === 0 || days.every((d) => d.items.length === 0)) throw new Error('Keine Übungen gefunden')
  return days
}

/** Fügt importierte Tage hinzu. Tage mit gleichem Namen werden ersetzt, Übungen anhand des Namens wiederverwendet (Verlauf bleibt erhalten). */
export function applyPlanImport(data: AppData, days: ImportedDay[]): AppData {
  let d = data
  for (const day of days) {
    const items: PlanItem[] = day.items.map((it) => {
      const [d2, ex] = ensureExercise(d, it.exercise)
      d = d2
      return { id: uid(), exerciseId: ex.id, sets: it.sets, targetReps: it.targetReps, restSec: it.restSec }
    })
    const existing = d.days.find((x) => x.name.trim().toLowerCase() === day.name.trim().toLowerCase())
    if (existing) {
      d = { ...d, days: d.days.map((x) => (x.id === existing.id ? { ...x, items } : x)) }
    } else {
      const newDay: PlanDay = { id: uid(), name: day.name, items }
      d = { ...d, days: [...d.days, newDay] }
    }
  }
  return d
}
