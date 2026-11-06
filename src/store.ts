import { useCallback, useEffect, useState } from 'react'
import type { AppData, Exercise, PlanDay, Session, SetEntry } from './types'

const STORAGE_KEY = 'fitnessprogress:v1'

export const emptyData = (): AppData => ({
  version: 1,
  exercises: [],
  days: [],
  sessions: [],
})

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    return validate(JSON.parse(raw))
  } catch {
    return emptyData()
  }
}

export function validate(data: unknown): AppData {
  const d = data as Partial<AppData>
  if (!d || typeof d !== 'object' || !Array.isArray(d.exercises) || !Array.isArray(d.days) || !Array.isArray(d.sessions)) {
    throw new Error('Ungültige Datei')
  }
  return { version: 1, exercises: d.exercises, days: d.days, sessions: d.sessions }
}

export function useAppData() {
  const [data, setData] = useState<AppData>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Speicher nicht verfügbar – Daten bleiben nur bis zum Neuladen erhalten
    }
  }, [data])

  // Persistenten Speicher anfragen, damit der Browser die Daten nicht automatisch löscht
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {})
  }, [])

  const update = useCallback((fn: (d: AppData) => AppData) => setData(fn), [])
  return [data, update] as const
}

// ---------- Abfragen ----------

export const exerciseName = (data: AppData, id: string) =>
  data.exercises.find((e) => e.id === id)?.name ?? '(gelöscht)'

export const activeSession = (data: AppData): Session | undefined =>
  data.sessions.find((s) => s.finishedAt === null)

/** Abgeschlossene Trainings, neueste zuerst */
export const finishedSessions = (data: AppData) =>
  data.sessions
    .filter((s) => s.finishedAt !== null)
    .sort((a, b) => b.startedAt - a.startedAt)

/** Sätze der Übung aus dem letzten abgeschlossenen Training (egal welcher Trainingstag) */
export function lastSets(data: AppData, exerciseId: string, excludeSessionId?: string): { date: number; sets: SetEntry[] } | null {
  for (const s of finishedSessions(data)) {
    if (s.id === excludeSessionId) continue
    const entry = s.entries.find((e) => e.exerciseId === exerciseId)
    const sets = entry?.sets.filter((x) => x.done && x.reps !== null)
    if (sets && sets.length > 0) return { date: s.startedAt, sets }
  }
  return null
}

export interface HistoryPoint {
  date: number
  sets: SetEntry[]
  maxWeight: number
  volume: number
  best1RM: number
}

/** Epley-Formel für geschätztes 1RM */
export const estimate1RM = (weight: number, reps: number) =>
  reps <= 1 ? weight : weight * (1 + reps / 30)

export function exerciseHistory(data: AppData, exerciseId: string): HistoryPoint[] {
  const points: HistoryPoint[] = []
  for (const s of finishedSessions(data)) {
    const entry = s.entries.find((e) => e.exerciseId === exerciseId)
    const sets = entry?.sets.filter((x) => x.done && x.reps !== null) ?? []
    if (sets.length === 0) continue
    let maxWeight = -Infinity
    let volume = 0
    let best1RM = -Infinity
    for (const x of sets) {
      const w = x.weight ?? 0
      const r = x.reps ?? 0
      maxWeight = Math.max(maxWeight, w)
      // Negative Gewichte = Unterstützung (z. B. Klimmzugmaschine): kein Volumen, 1RM = Gewicht
      volume += Math.max(0, w) * r
      best1RM = Math.max(best1RM, w > 0 ? estimate1RM(w, r) : w)
    }
    points.push({ date: s.startedAt, sets, maxWeight, volume, best1RM })
  }
  return points.reverse() // älteste zuerst
}

// ---------- Mutationen ----------

export function ensureExercise(data: AppData, name: string): [AppData, Exercise] {
  const trimmed = name.trim()
  const existing = data.exercises.find((e) => e.name.toLowerCase() === trimmed.toLowerCase())
  if (existing) return [data, existing]
  const ex: Exercise = { id: uid(), name: trimmed }
  return [{ ...data, exercises: [...data.exercises, ex] }, ex]
}

export function startSession(data: AppData, day: PlanDay): AppData {
  const session: Session = {
    id: uid(),
    dayId: day.id,
    dayName: day.name,
    startedAt: Date.now(),
    finishedAt: null,
    entries: day.items.map((item) => {
      const last = lastSets(data, item.exerciseId)
      const sets: SetEntry[] = Array.from({ length: item.sets }, (_, i) => {
        // Vorbelegen mit den Werten vom letzten Mal (gleicher Satz-Index, sonst letzter Satz)
        const prev = last ? last.sets[Math.min(i, last.sets.length - 1)] : undefined
        return { weight: prev?.weight ?? null, reps: prev?.reps ?? null, done: false }
      })
      return { exerciseId: item.exerciseId, restSec: item.restSec, targetReps: item.targetReps, sets }
    }),
  }
  return { ...data, sessions: [...data.sessions, session] }
}

export function updateSession(data: AppData, id: string, fn: (s: Session) => Session): AppData {
  return { ...data, sessions: data.sessions.map((s) => (s.id === id ? fn(s) : s)) }
}
