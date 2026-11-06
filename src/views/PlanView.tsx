import { useState } from 'react'
import type { AppData, PlanDay, PlanItem } from '../types'
import { ensureExercise, exerciseName, uid } from '../store'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

export default function PlanView({ data, update }: Props) {
  const [openDayId, setOpenDayId] = useState<string | null>(data.days[0]?.id ?? null)
  const [newDayName, setNewDayName] = useState('')

  const addDay = () => {
    const name = newDayName.trim() || `Tag ${String.fromCharCode(65 + data.days.length)}`
    const day: PlanDay = { id: uid(), name, items: [] }
    update((d) => ({ ...d, days: [...d.days, day] }))
    setOpenDayId(day.id)
    setNewDayName('')
  }

  const updateDay = (id: string, fn: (day: PlanDay) => PlanDay) =>
    update((d) => ({ ...d, days: d.days.map((x) => (x.id === id ? fn(x) : x)) }))

  const moveDay = (index: number, dir: -1 | 1) =>
    update((d) => ({ ...d, days: move(d.days, index, index + dir) }))

  const deleteDay = (day: PlanDay) => {
    if (!confirm(`Trainingstag „${day.name}" löschen? Bisherige Trainings bleiben erhalten.`)) return
    update((d) => ({ ...d, days: d.days.filter((x) => x.id !== day.id) }))
  }

  return (
    <div>
      <h1>Trainingsplan</h1>

      {data.days.length === 0 && (
        <p className="muted">Lege deinen ersten Trainingstag an, z. B. „Push“, „Pull“, „Beine“ oder „Tag A“.</p>
      )}

      {data.days.map((day, i) => (
        <section key={day.id} className="card">
          <div className="row">
            <button className="day-toggle" onClick={() => setOpenDayId(openDayId === day.id ? null : day.id)}>
              <span className="chev">{openDayId === day.id ? '▾' : '▸'}</span>
              <strong>{day.name}</strong>
              <span className="muted small"> · {day.items.length} Übungen</span>
            </button>
            <button className="icon-btn" disabled={i === 0} onClick={() => moveDay(i, -1)} aria-label="nach oben">↑</button>
            <button className="icon-btn" disabled={i === data.days.length - 1} onClick={() => moveDay(i, 1)} aria-label="nach unten">↓</button>
          </div>

          {openDayId === day.id && (
            <DayEditor
              data={data}
              day={day}
              update={update}
              onChange={(fn) => updateDay(day.id, fn)}
              onDelete={() => deleteDay(day)}
            />
          )}
        </section>
      ))}

      <div className="row add-row">
        <input
          placeholder="Neuer Trainingstag (z. B. Push)"
          value={newDayName}
          onChange={(e) => setNewDayName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addDay()}
        />
        <button className="btn primary" onClick={addDay}>+ Tag</button>
      </div>
    </div>
  )
}

function DayEditor({
  data,
  day,
  update,
  onChange,
  onDelete,
}: {
  data: AppData
  day: PlanDay
  update: Props['update']
  onChange: (fn: (day: PlanDay) => PlanDay) => void
  onDelete: () => void
}) {
  const [exName, setExName] = useState('')

  const addExercise = () => {
    if (!exName.trim()) return
    update((d) => {
      const [d2, ex] = ensureExercise(d, exName)
      const item: PlanItem = { id: uid(), exerciseId: ex.id, sets: 3, targetReps: '8-12', restSec: 90 }
      return { ...d2, days: d2.days.map((x) => (x.id === day.id ? { ...x, items: [...x.items, item] } : x)) }
    })
    setExName('')
  }

  const setItem = (id: string, patch: Partial<PlanItem>) =>
    onChange((dd) => ({ ...dd, items: dd.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }))

  return (
    <div className="day-editor">
      <label className="field">
        <span>Name</span>
        <input value={day.name} onChange={(e) => onChange((dd) => ({ ...dd, name: e.target.value }))} />
      </label>

      {day.items.map((item, i) => (
        <div key={item.id} className="plan-item">
          <div className="row">
            <strong className="grow">{exerciseName(data, item.exerciseId)}</strong>
            <button className="icon-btn" disabled={i === 0} onClick={() => onChange((dd) => ({ ...dd, items: move(dd.items, i, i - 1) }))} aria-label="nach oben">↑</button>
            <button className="icon-btn" disabled={i === day.items.length - 1} onClick={() => onChange((dd) => ({ ...dd, items: move(dd.items, i, i + 1) }))} aria-label="nach unten">↓</button>
            <button className="icon-btn danger" onClick={() => onChange((dd) => ({ ...dd, items: dd.items.filter((x) => x.id !== item.id) }))} aria-label="entfernen">✕</button>
          </div>
          <div className="grid3">
            <label className="field">
              <span>Sätze</span>
              <input type="number" inputMode="numeric" min={1} max={20} value={item.sets}
                onChange={(e) => setItem(item.id, { sets: clamp(parseInt(e.target.value) || 1, 1, 20) })} />
            </label>
            <label className="field">
              <span>Wdh. (Ziel)</span>
              <input value={item.targetReps} placeholder="8-12" onChange={(e) => setItem(item.id, { targetReps: e.target.value })} />
            </label>
            <label className="field">
              <span>Pause (s)</span>
              <input type="number" inputMode="numeric" min={0} step={15} value={item.restSec}
                onChange={(e) => setItem(item.id, { restSec: Math.max(0, parseInt(e.target.value) || 0) })} />
            </label>
          </div>
        </div>
      ))}

      <div className="row add-row">
        <input
          list="exercise-list"
          placeholder="Übung hinzufügen (z. B. Bankdrücken)"
          value={exName}
          onChange={(e) => setExName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addExercise()}
        />
        <button className="btn primary" onClick={addExercise}>+</button>
      </div>
      <datalist id="exercise-list">
        {data.exercises.map((e) => <option key={e.id} value={e.name} />)}
      </datalist>

      <button className="btn danger-outline" onClick={onDelete}>Trainingstag löschen</button>
    </div>
  )
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr
  const copy = [...arr]
  const [x] = copy.splice(from, 1)
  copy.splice(to, 0, x)
  return copy
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
