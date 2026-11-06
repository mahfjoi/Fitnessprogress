import { useRef, useState } from 'react'
import type { AppData } from '../types'
import { emptyData, finishedSessions, validate } from '../store'
import { applyPlanImport, historyCount, parsePlanText, type ImportedDay } from '../planImport'
import { formatDate, formatKg } from '../format'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

export default function DataView({ data, update }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const planFileRef = useRef<HTMLInputElement>(null)
  const [planText, setPlanText] = useState('')
  const [preview, setPreview] = useState<ImportedDay[] | null>(null)
  const [planError, setPlanError] = useState('')

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitnessprogress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (file: File) => {
    try {
      const parsed = validate(JSON.parse(await file.text()))
      if (!confirm(`Backup laden? ${parsed.sessions.length} Trainings, ${parsed.days.length} Trainingstage. Aktuelle Daten werden ersetzt.`)) return
      update(() => parsed)
      alert('Backup geladen.')
    } catch (e) {
      alert('Import fehlgeschlagen: ' + (e as Error).message)
    }
  }

  const checkPlan = (text: string) => {
    setPlanText(text)
    try {
      setPreview(parsePlanText(text))
      setPlanError('')
    } catch (e) {
      setPreview(null)
      setPlanError((e as Error).message)
    }
  }

  const importPlan = () => {
    if (!preview) return
    const replaced = preview.filter((p) => data.days.some((d) => d.name.trim().toLowerCase() === p.name.trim().toLowerCase()))
    if (replaced.length > 0 && !confirm(`Folgende Trainingstage gibt es schon und werden ersetzt: ${replaced.map((r) => r.name).join(', ')}. Dein Trainingsverlauf bleibt erhalten. Fortfahren?`)) return
    update((d) => applyPlanImport(d, preview))
    const h = historyCount(preview)
    alert(`${preview.length} Trainingstag(e) importiert${h ? `, inkl. letzter Werte für ${h} Übungen` : ''}.`)
    setPlanText('')
    setPreview(null)
  }

  const reset = () => {
    if (!confirm('Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden.')) return
    update(() => emptyData())
  }

  return (
    <div>
      <h1>Daten</h1>

      <div className="card">
        <h3>Plan importieren</h3>
        <p className="muted small">
          Plantext einfügen oder Textdatei wählen. Vorhandene Trainingstage mit gleichem Namen werden ersetzt, alles andere bleibt.
        </p>
        <textarea
          className="plan-text"
          rows={8}
          placeholder={'Tag: Tag 1\nBankdrücken | 3 | 8-10 | 120\nKlimmzüge | 3 | 6-8 | 120'}
          value={planText}
          onChange={(e) => checkPlan(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {planError && planText.trim() && <p className="error small">{planError}</p>}
        {preview && (
          <div className="import-preview small">
            {preview.map((day, i) => (
              <div key={i}>
                <strong>{day.name}</strong>
                {day.lastDate && historyCount([day]) > 0 && (
                  <span className="muted"> · letztes Training {formatDate(day.lastDate)}</span>
                )}
                <ul>
                  {day.items.map((it, j) => (
                    <li key={j}>
                      {it.exercise} – {it.sets} × {it.targetReps || '?'}{it.restSec ? `, ${it.restSec}s Pause` : ''}
                      {it.history.length > 0 && (
                        <div className="muted">
                          zuletzt: {it.history.map((h) => (h.weight === null ? `${h.reps} Wdh.` : `${formatKg(h.weight)}×${h.reps}`)).join(', ')}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div className="stack">
          <button className="btn primary" disabled={!preview} onClick={importPlan}>Plan importieren</button>
          <button className="btn" onClick={() => planFileRef.current?.click()}>Textdatei wählen</button>
          <input
            ref={planFileRef}
            type="file"
            accept=".txt,text/plain"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f) checkPlan(await f.text())
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="card">
        <h3>Backup</h3>
        <p className="small">
          Deine Daten werden nur lokal auf diesem Gerät im Browser gespeichert.
          Exportiere regelmäßig ein Backup, damit nichts verloren geht.
        </p>
        <p className="muted small">
          {data.days.length} Trainingstage · {data.exercises.length} Übungen · {finishedSessions(data).length} Trainings
        </p>
        <div className="stack">
          <button className="btn primary" onClick={exportData}>Backup exportieren (JSON)</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Backup importieren</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importData(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>
      <button className="btn danger-outline" onClick={reset}>Alle Daten löschen</button>
    </div>
  )
}
