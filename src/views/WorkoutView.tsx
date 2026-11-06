import { useEffect, useRef, useState, type RefObject } from 'react'
import type { AppData, Session, SessionEntry, SetEntry } from '../types'
import { ensureExercise, exerciseName, lastSets, updateSession } from '../store'
import { formatDate, formatKg, formatSet, formatTimer } from '../format'
import NumInput from '../components/NumInput'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
  session: Session
}

interface Rest {
  endAt: number
  total: number
}

export default function WorkoutView({ data, update, session }: Props) {
  const [rest, setRest] = useState<Rest | null>(null)
  const [newEx, setNewEx] = useState('')
  const audioRef = useRef<AudioContext | null>(null)
  const elapsed = useNow(1000) - session.startedAt

  const patch = (fn: (s: Session) => Session) => update((d) => updateSession(d, session.id, fn))

  const patchEntry = (ei: number, fn: (e: SessionEntry) => SessionEntry) =>
    patch((s) => ({ ...s, entries: s.entries.map((e, i) => (i === ei ? fn(e) : e)) }))

  const patchSet = (ei: number, si: number, p: Partial<SetEntry>) =>
    patchEntry(ei, (e) => ({ ...e, sets: e.sets.map((x, i) => (i === si ? { ...x, ...p } : x)) }))

  const toggleDone = (ei: number, si: number) => {
    const entry = session.entries[ei]
    const set = entry.sets[si]
    const nowDone = !set.done
    patchSet(ei, si, { done: nowDone, reps: set.reps ?? parseFirstNumber(entry.targetReps) })
    if (nowDone && entry.restSec > 0) {
      // AudioContext muss in einer Nutzeraktion erzeugt werden
      if (!audioRef.current) {
        try {
          audioRef.current = new AudioContext()
        } catch {
          /* kein Audio */
        }
      }
      setRest({ endAt: Date.now() + entry.restSec * 1000, total: entry.restSec })
    }
  }

  const addSet = (ei: number) =>
    patchEntry(ei, (e) => {
      const last = e.sets[e.sets.length - 1]
      return { ...e, sets: [...e.sets, { weight: last?.weight ?? null, reps: last?.reps ?? null, done: false }] }
    })

  const removeSet = (ei: number) =>
    patchEntry(ei, (e) => ({ ...e, sets: e.sets.slice(0, -1) }))

  const addExercise = () => {
    if (!newEx.trim()) return
    update((d) => {
      const [d2, ex] = ensureExercise(d, newEx)
      const last = lastSets(d2, ex.id)
      const sets: SetEntry[] = (last?.sets ?? [null, null, null]).map((p) => ({
        weight: p?.weight ?? null,
        reps: p?.reps ?? null,
        done: false,
      }))
      return updateSession(d2, session.id, (s) => ({
        ...s,
        entries: [...s.entries, { exerciseId: ex.id, restSec: 90, targetReps: '', sets }],
      }))
    })
    setNewEx('')
  }

  const finish = () => {
    const done = session.entries.some((e) => e.sets.some((x) => x.done))
    if (!done) {
      if (confirm('Noch kein Satz abgehakt. Training verwerfen?')) discard(true)
      return
    }
    if (!confirm('Training beenden und speichern?')) return
    patch((s) => ({ ...s, finishedAt: Date.now() }))
    setRest(null)
  }

  const discard = (skipConfirm = false) => {
    if (!skipConfirm && !confirm('Training abbrechen? Die Eingaben gehen verloren.')) return
    update((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== session.id) }))
    setRest(null)
  }

  const totalSets = session.entries.reduce((n, e) => n + e.sets.length, 0)
  const doneSets = session.entries.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0)

  return (
    <div className={rest ? 'with-timer' : ''}>
      <div className="workout-head">
        <div>
          <h1>{session.dayName}</h1>
          <div className="muted small">
            {formatTimer(elapsed / 1000)} · {doneSets}/{totalSets} Sätze
          </div>
        </div>
        <button className="btn primary" onClick={finish}>Fertig</button>
      </div>
      <div className="progress"><div style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} /></div>

      {session.entries.map((entry, ei) => {
        const last = lastSets(data, entry.exerciseId, session.id)
        const allDone = entry.sets.length > 0 && entry.sets.every((x) => x.done)
        return (
          <section key={ei} className={'card exercise' + (allDone ? ' complete' : '')}>
            <div className="row">
              <h3 className="grow">{exerciseName(data, entry.exerciseId)}</h3>
              {entry.targetReps && <span className="muted small">Ziel {entry.sets.length} × {entry.targetReps}</span>}
            </div>

            <div className="last">
              {last ? (
                <>
                  <span className="muted">Letztes Mal ({formatDate(last.date)}):</span>{' '}
                  {last.sets.map(formatSet).join(' · ')}
                </>
              ) : (
                <span className="muted">Erstes Mal – noch keine Werte</span>
              )}
            </div>

            <div className="set-grid set-head">
              <span>Satz</span>
              <span>Vorher</span>
              <span>kg</span>
              <span>Wdh.</span>
              <span />
            </div>
            {entry.sets.map((set, si) => {
              const prev = last?.sets[si]
              return (
                <div key={si} className={'set-grid set-row' + (set.done ? ' done' : '')}>
                  <span className="set-no">{si + 1}</span>
                  <span className="muted small prev">
                    {prev ? `${formatKg(prev.weight)} × ${prev.reps}` : '–'}
                  </span>
                  <NumInput decimal value={set.weight} placeholder="kg" onChange={(v) => patchSet(ei, si, { weight: v })} />
                  <NumInput value={set.reps} placeholder={parseFirstNumber(entry.targetReps)?.toString() ?? 'Wdh'} onChange={(v) => patchSet(ei, si, { reps: v })} />
                  <button className={'check' + (set.done ? ' on' : '')} onClick={() => toggleDone(ei, si)} aria-label="Satz erledigt">✓</button>
                </div>
              )
            })}
            <div className="row set-actions">
              <button className="btn small" onClick={() => addSet(ei)}>+ Satz</button>
              <button className="btn small" disabled={entry.sets.length === 0} onClick={() => removeSet(ei)}>− Satz</button>
            </div>
          </section>
        )
      })}

      <div className="row add-row">
        <input
          list="exercise-list-workout"
          placeholder="Übung hinzufügen"
          value={newEx}
          onChange={(e) => setNewEx(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addExercise()}
        />
        <button className="btn" onClick={addExercise}>+</button>
      </div>
      <datalist id="exercise-list-workout">
        {data.exercises.map((e) => <option key={e.id} value={e.name} />)}
      </datalist>

      <button className="btn danger-outline" onClick={() => discard()}>Training abbrechen</button>

      {rest && <RestTimer rest={rest} setRest={setRest} audioRef={audioRef} />}
    </div>
  )
}

function RestTimer({ rest, setRest, audioRef }: { rest: Rest; setRest: (r: Rest | null) => void; audioRef: RefObject<AudioContext | null> }) {
  const now = useNow(250)
  const left = (rest.endAt - now) / 1000
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
  }, [rest.endAt])

  useEffect(() => {
    if (left <= 0 && !firedRef.current) {
      firedRef.current = true
      navigator.vibrate?.([300, 150, 300])
      beep(audioRef.current)
    }
  }, [left])

  const over = left <= 0
  return (
    <div className={'rest-timer' + (over ? ' over' : '')}>
      <div className="rest-bar" style={{ width: `${Math.max(0, Math.min(1, left / rest.total)) * 100}%` }} />
      <div className="rest-content">
        <span className="rest-label">{over ? 'Pause vorbei' : 'Pause'}</span>
        <span className="rest-time">{over ? `+${formatTimer(-left)}` : formatTimer(left)}</span>
        <button className="btn small" onClick={() => setRest({ endAt: rest.endAt - 15000, total: rest.total })}>−15</button>
        <button className="btn small" onClick={() => setRest({ endAt: rest.endAt + 15000, total: rest.total + 15 })}>+15</button>
        <button className="btn small" onClick={() => setRest(null)}>✕</button>
      </div>
    </div>
  )
}

function useNow(interval: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

function beep(ctx: AudioContext | null) {
  if (!ctx) return
  try {
    ctx.resume()
    ;[0, 0.25, 0.5].forEach((offset) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.25, ctx.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.18)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + offset)
      osc.stop(ctx.currentTime + offset + 0.2)
    })
  } catch {
    /* ignorieren */
  }
}

function parseFirstNumber(s: string): number | null {
  const m = s.match(/\d+/)
  return m ? parseInt(m[0]) : null
}
