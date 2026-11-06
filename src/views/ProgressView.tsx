import { useMemo, useState } from 'react'
import type { AppData } from '../types'
import { exerciseHistory } from '../store'
import { formatDate, formatKg, formatSet, formatShortDate } from '../format'
import LineChart from '../components/LineChart'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

type Metric = 'maxWeight' | 'best1RM' | 'volume' | 'maxReps'

const METRICS: { id: Metric; label: string }[] = [
  { id: 'maxWeight', label: 'Max. Gewicht' },
  { id: 'best1RM', label: '1RM (geschätzt)' },
  { id: 'volume', label: 'Volumen' },
  { id: 'maxReps', label: 'Max. Wdh.' },
]

export default function ProgressView({ data, update }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [metric, setMetric] = useState<Metric>('maxWeight')

  const summaries = useMemo(
    () =>
      data.exercises
        .map((ex) => ({ ex, history: exerciseHistory(data, ex.id) }))
        .sort((a, b) => (b.history.at(-1)?.date ?? 0) - (a.history.at(-1)?.date ?? 0)),
    [data],
  )

  const current = summaries.find((s) => s.ex.id === selected)

  if (current) {
    const { ex, history } = current
    const value = (h: (typeof history)[number]) =>
      metric === 'maxReps' ? Math.max(...h.sets.map((s) => s.reps ?? 0)) : h[metric]
    const unit = metric === 'maxReps' ? 'Wdh.' : 'kg'
    const pts = history.map((h) => ({ x: h.date, y: Math.round(value(h) * 10) / 10 }))
    const best = pts.length ? Math.max(...pts.map((p) => p.y)) : 0
    const first = pts[0]?.y ?? 0
    const lastV = pts.at(-1)?.y ?? 0

    const rename = () => {
      const name = prompt('Neuer Name der Übung', ex.name)?.trim()
      if (!name) return
      update((d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === ex.id ? { ...e, name } : e)) }))
    }

    return (
      <div>
        <button className="link" onClick={() => setSelected(null)}>‹ Alle Übungen</button>
        <div className="row">
          <h1 className="grow">{ex.name}</h1>
          <button className="btn small" onClick={rename}>Umbenennen</button>
        </div>

        {history.length === 0 ? (
          <p className="muted">Für diese Übung gibt es noch keine abgeschlossenen Trainings.</p>
        ) : (
          <>
            <div className="chips">
              {METRICS.map((m) => (
                <button key={m.id} className={'chip' + (metric === m.id ? ' on' : '')} onClick={() => setMetric(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>

            <div className="stats">
              <div className="stat"><span className="stat-v">{formatKg(lastV)}</span><span className="stat-l">Aktuell ({unit})</span></div>
              <div className="stat"><span className="stat-v">{formatKg(best)}</span><span className="stat-l">Bestwert ({unit})</span></div>
              <div className="stat">
                <span className="stat-v">{lastV - first >= 0 ? '+' : '−'}{formatKg(Math.abs(Math.round((lastV - first) * 10) / 10))}</span>
                <span className="stat-l">seit Beginn</span>
              </div>
            </div>

            <div className="card">
              <LineChart points={pts} formatY={(v) => formatKg(v)} formatX={formatShortDate} />
            </div>

            <h2>Verlauf</h2>
            {[...history].reverse().map((h) => (
              <div key={h.date} className="card compact">
                <div className="row">
                  <strong className="grow">{formatDate(h.date)}</strong>
                  <span className="muted small">1RM ≈ {formatKg(Math.round(h.best1RM * 10) / 10)} kg</span>
                </div>
                <div className="small">{h.sets.map(formatSet).join(' · ')}</div>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <h1>Fortschritt</h1>
      {summaries.length === 0 && <p className="muted">Noch keine Übungen vorhanden.</p>}
      {summaries.map(({ ex, history }) => {
        const last = history.at(-1)
        const first = history[0]
        const diff = last && first ? last.maxWeight - first.maxWeight : 0
        return (
          <button key={ex.id} className="card list-item row" onClick={() => setSelected(ex.id)}>
            <div className="grow left">
              <strong>{ex.name}</strong>
              <div className="muted small">
                {last ? `${history.length}× trainiert · zuletzt ${formatDate(last.date)}` : 'noch nicht trainiert'}
              </div>
            </div>
            {last && (
              <div className="right">
                <div>{formatKg(last.maxWeight)} kg</div>
                {history.length > 1 && (
                  <div className={'small ' + (diff > 0 ? 'up' : 'muted')}>
                    {diff > 0 ? '▲ +' : diff < 0 ? '▼ ' : '± '}{formatKg(Math.round(diff * 10) / 10)}
                  </div>
                )}
              </div>
            )}
            <span className="chev">›</span>
          </button>
        )
      })}
    </div>
  )
}
