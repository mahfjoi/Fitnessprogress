import type { AppData, PlanDay, PlanItem, Session } from './types'
import { ensureExercise, uid } from './store'

export interface ImportedSet {
  weight: number | null
  reps: number
}

export interface ImportedItem {
  exercise: string
  sets: number
  targetReps: string
  restSec: number
  /** Satzwerte eines vergangenen Trainings (optional) */
  history: ImportedSet[]
}

export interface ImportedDay {
  name: string
  items: ImportedItem[]
  /** Datum des vergangenen Trainings, zu dem die Satzwerte gehören */
  lastDate: number | null
  durationMin: number | null
}

/**
 * Liest einen Plan im Textformat:
 *
 *   Tag: Tag 1
 *   Zuletzt: 03.09.2026 22:39 | 40
 *   Bankdrücken | 3 | 8-10 | 120 | 35x10, 35x7, 30x7
 *   Klimmzüge | 3 | 6-8
 *
 * Spalten: Übung | Sätze | Wiederholungen | Pause in Sekunden | Satzwerte vom letzten Training
 * (alles außer der Übung optional). Trennzeichen: | oder ;  –  Zeilen mit # sind Kommentare.
 * „Zuletzt:“ gibt Datum (und optional Dauer in Minuten) des letzten Trainings an.
 */
export function parsePlanText(text: string): ImportedDay[] {
  const days: ImportedDay[] = []
  let current: ImportedDay | null = null
  const newDay = (name: string): ImportedDay => ({ name, items: [], lastDate: null, durationMin: null })

  text.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || line.startsWith('//')) return
    const err = (msg: string) => new Error(`Zeile ${i + 1}: ${msg}`)

    const dayMatch = line.match(/^(?:tag|day|training)\s*:\s*(.+)$/i)
    if (dayMatch) {
      current = newDay(dayMatch[1].trim())
      days.push(current)
      return
    }

    const lastMatch = line.match(/^(?:zuletzt|datum|last)\s*:\s*(.+)$/i)
    if (lastMatch) {
      if (!current) throw err('„Zuletzt:“ muss nach „Tag:“ stehen')
      const [datePart, durPart] = lastMatch[1].split(/[|;]/).map((s) => s.trim())
      const date = parseDate(datePart)
      if (date === null) throw err(`ungültiges Datum „${datePart}“ (Format: 03.09.2026 22:39)`)
      current.lastDate = date
      current.durationMin = durPart ? parseInt(durPart) || null : null
      return
    }

    const parts = line.split(/[|;]/).map((p) => p.trim())
    const name = parts[0]
    if (!name) throw err('Übungsname fehlt')
    if (!current) {
      current = newDay('Importierter Tag')
      days.push(current)
    }

    const sets = parts[1] ? parseInt(parts[1]) : 3
    if (!Number.isFinite(sets) || sets < 1 || sets > 20) throw err(`ungültige Satzanzahl „${parts[1]}“`)
    const rest = parts[3] ? parseInt(parts[3]) : 90
    if (!Number.isFinite(rest) || rest < 0) throw err(`ungültige Pause „${parts[3]}“`)

    const history: ImportedSet[] = []
    if (parts[4]) {
      // z. B. "35x10, 32,5x8, -120x6, x12"
      const re = /(-?\d+(?:[.,]\d+)?)?\s*[x×*]\s*(\d+)/gi
      let m: RegExpExecArray | null
      while ((m = re.exec(parts[4]))) {
        history.push({ weight: m[1] ? parseFloat(m[1].replace(',', '.')) : null, reps: parseInt(m[2]) })
      }
      if (history.length === 0) throw err(`Satzwerte nicht erkannt „${parts[4]}“ (Format: 35x10, 35x8)`)
    }

    current.items.push({ exercise: name, sets, targetReps: (parts[2] ?? '').replace(/–/g, '-'), restSec: rest, history })
  })

  if (days.length === 0 || days.every((d) => d.items.length === 0)) throw new Error('Keine Übungen gefunden')
  return days
}

function parseDate(s: string): number | null {
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/)
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] ?? 12), +(m[5] ?? 0)).getTime()
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?$/)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 12), +(m[5] ?? 0)).getTime()
  return null
}

/**
 * Fügt importierte Tage hinzu. Tage mit gleichem Namen werden ersetzt, Übungen anhand des Namens
 * wiederverwendet (Verlauf bleibt erhalten). Satzwerte werden als abgeschlossenes Training angelegt.
 */
export function applyPlanImport(data: AppData, days: ImportedDay[]): AppData {
  let d = data
  for (const day of days) {
    const exerciseIds: string[] = []
    const items: PlanItem[] = day.items.map((it) => {
      const [d2, ex] = ensureExercise(d, it.exercise)
      d = d2
      exerciseIds.push(ex.id)
      return { id: uid(), exerciseId: ex.id, sets: it.sets, targetReps: it.targetReps, restSec: it.restSec }
    })

    const existing = d.days.find((x) => x.name.trim().toLowerCase() === day.name.trim().toLowerCase())
    let dayId: string
    if (existing) {
      dayId = existing.id
      d = { ...d, days: d.days.map((x) => (x.id === existing.id ? { ...x, items } : x)) }
    } else {
      const created: PlanDay = { id: uid(), name: day.name, items }
      dayId = created.id
      d = { ...d, days: [...d.days, created] }
    }

    // Vergangenes Training anlegen (nur einmal, auch bei erneutem Import)
    if (day.items.some((it) => it.history.length > 0)) {
      const startedAt = day.lastDate ?? Date.now()
      const duplicate = d.sessions.some((s) => s.dayId === dayId && s.startedAt === startedAt)
      if (!duplicate) {
        const session: Session = {
          id: uid(),
          dayId,
          dayName: day.name,
          startedAt,
          finishedAt: startedAt + (day.durationMin ?? 60) * 60000,
          entries: day.items
            .map((it, idx) => ({
              exerciseId: exerciseIds[idx],
              restSec: it.restSec,
              targetReps: it.targetReps,
              sets: it.history.map((h) => ({ weight: h.weight, reps: h.reps, done: true })),
            }))
            .filter((e) => e.sets.length > 0),
        }
        d = { ...d, sessions: [...d.sessions, session] }
      }
    }
  }
  return d
}

/** Anzahl der Übungen mit Satzwerten – für die Vorschau */
export const historyCount = (days: ImportedDay[]) =>
  days.reduce((n, day) => n + day.items.filter((it) => it.history.length > 0).length, 0)
