export interface Exercise {
  id: string
  name: string
}

/** Eine Übung innerhalb eines Trainingstags */
export interface PlanItem {
  id: string
  exerciseId: string
  sets: number
  /** Zielwiederholungen, z. B. "8-12" – nur als Hinweis */
  targetReps: string
  /** Pause zwischen den Sätzen in Sekunden */
  restSec: number
}

export interface PlanDay {
  id: string
  name: string
  items: PlanItem[]
}

export interface SetEntry {
  weight: number | null
  reps: number | null
  done: boolean
}

export interface SessionEntry {
  exerciseId: string
  restSec: number
  targetReps: string
  sets: SetEntry[]
}

export interface Session {
  id: string
  dayId: string
  dayName: string
  startedAt: number
  finishedAt: number | null
  entries: SessionEntry[]
}

export interface AppData {
  version: 1
  exercises: Exercise[]
  days: PlanDay[]
  sessions: Session[]
}
