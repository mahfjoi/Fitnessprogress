import type { AppData } from '../types'
import { activeSession, exerciseName, finishedSessions, startSession } from '../store'
import WorkoutView from './WorkoutView'
import { formatDate } from '../format'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
  goToPlan: () => void
}

export default function TrainingView({ data, update, goToPlan }: Props) {
  const running = activeSession(data)
  if (running) return <WorkoutView data={data} update={update} session={running} />

  const history = finishedSessions(data)
  const lastDoneAt = (dayId: string) => history.find((s) => s.dayId === dayId)?.startedAt

  // Vorschlag: der Tag, der am längsten nicht trainiert wurde
  const suggested = [...data.days]
    .filter((d) => d.items.length > 0)
    .sort((a, b) => (lastDoneAt(a.id) ?? 0) - (lastDoneAt(b.id) ?? 0))[0]

  return (
    <div>
      <h1>Training</h1>

      {data.days.length === 0 ? (
        <div className="card empty">
          <p>Du hast noch keinen Trainingsplan.</p>
          <button className="btn primary" onClick={goToPlan}>Plan erstellen</button>
        </div>
      ) : (
        data.days.map((day) => {
          const last = lastDoneAt(day.id)
          return (
            <section key={day.id} className={'card day-card' + (day.id === suggested?.id ? ' suggested' : '')}>
              <div className="row">
                <div className="grow">
                  <strong>{day.name}</strong>
                  {day.id === suggested?.id && <span className="badge">als Nächstes</span>}
                  <div className="muted small">
                    {day.items.length} Übungen · {last ? `zuletzt ${formatDate(last)}` : 'noch nie trainiert'}
                  </div>
                </div>
                <button
                  className="btn primary"
                  disabled={day.items.length === 0}
                  onClick={() => update((d) => startSession(d, day))}
                >
                  Start
                </button>
              </div>
              {day.items.length > 0 && (
                <div className="muted small ex-preview">
                  {day.items.map((it) => exerciseName(data, it.exerciseId)).join(' · ')}
                </div>
              )}
            </section>
          )
        })
      )}

      {history.length > 0 && (
        <>
          <h2>Letzte Trainings</h2>
          {history.slice(0, 10).map((s) => {
            const sets = s.entries.flatMap((e) => e.sets.filter((x) => x.done))
            const volume = sets.reduce((sum, x) => sum + Math.max(0, x.weight ?? 0) * (x.reps ?? 0), 0)
            const mins = s.finishedAt ? Math.round((s.finishedAt - s.startedAt) / 60000) : 0
            return (
              <div key={s.id} className="card compact row">
                <div className="grow">
                  <strong>{s.dayName}</strong>
                  <div className="muted small">{formatDate(s.startedAt)} · {mins} min</div>
                </div>
                <div className="right small muted">
                  {sets.length} Sätze<br />{Math.round(volume).toLocaleString('de-DE')} kg
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
