import { useRef } from 'react'
import type { AppData } from '../types'
import { emptyData, finishedSessions, validate } from '../store'

interface Props {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

export default function DataView({ data, update }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

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

  const reset = () => {
    if (!confirm('Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden.')) return
    update(() => emptyData())
  }

  return (
    <div>
      <h1>Daten</h1>
      <div className="card">
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
