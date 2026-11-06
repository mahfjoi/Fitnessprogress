import { Component, type ReactNode } from 'react'

const STORAGE_KEY = 'fitnessprogress:v1'

/** Fängt Absturzfehler ab und zeigt sie an, statt eine leere Seite zu hinterlassen */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  downloadBackup = () => {
    let raw = ''
    try {
      raw = localStorage.getItem(STORAGE_KEY) ?? ''
    } catch {
      /* nicht verfügbar */
    }
    const blob = new Blob([raw], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `fitnessprogress-notfall-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="content">
        <h1>Fehler</h1>
        <div className="card">
          <p>Die App ist abgestürzt. Deine Daten sind noch gespeichert.</p>
          <pre className="error-text">
            {error.message}
            {'\n\n'}
            {error.stack}
            {'\n\n'}
            {navigator.userAgent}
          </pre>
          <div className="stack">
            <button className="btn primary" onClick={() => location.reload()}>Neu laden</button>
            <button className="btn" onClick={this.downloadBackup}>Daten sichern (Backup herunterladen)</button>
          </div>
        </div>
      </div>
    )
  }
}
