import { useEffect, useMemo, useState } from 'react'
import type { AppData } from '../types'
import { CATALOG, REGIONS, catalogRegion } from '../catalog'

interface Option {
  name: string
  region: string | undefined
  /** Übung wurde schon einmal verwendet (ist in den eigenen Übungen) */
  known: boolean
}

const REGION_KEY = 'fitnessprogress:pickerRegion'

/**
 * Vollbild-Auswahl aus Katalog + eigenen Übungen, filterbar nach Körperregion und per Suche.
 * Bleibt offen, damit mehrere Übungen nacheinander hinzugefügt werden können.
 */
export default function ExercisePicker({
  data,
  addedNames,
  onPick,
  onClose,
  title = 'Übung hinzufügen',
}: {
  data: AppData
  /** Namen, die im aktuellen Tag/Training schon enthalten sind (werden mit Häkchen markiert) */
  addedNames: string[]
  onPick: (name: string, region: string | undefined) => void
  onClose: () => void
  title?: string
}) {
  const [region, setRegion] = useState<string>(() => {
    try {
      return localStorage.getItem(REGION_KEY) ?? 'Alle'
    } catch {
      return 'Alle'
    }
  })
  const [query, setQuery] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(REGION_KEY, region)
    } catch {
      /* egal */
    }
  }, [region])

  // Hintergrund nicht mitscrollen lassen
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const options = useMemo(() => {
    const map = new Map<string, Option>()
    for (const e of CATALOG) map.set(e.name.toLowerCase(), { name: e.name, region: e.region, known: false })
    for (const ex of data.exercises) {
      const key = ex.name.toLowerCase()
      const existing = map.get(key)
      if (existing) existing.known = true
      else map.set(key, { name: ex.name, region: ex.region ?? catalogRegion(ex.name), known: true })
    }
    return [...map.values()]
  }, [data.exercises])

  const added = useMemo(() => new Set(addedNames.map((n) => n.toLowerCase())), [addedNames])
  const q = normalize(query)

  const filtered = options
    .filter((o) => (region === 'Alle' || o.region === region) && (!q || normalize(o.name).includes(q)))
    .sort((a, b) => Number(b.known) - Number(a.known) || a.name.localeCompare(b.name, 'de'))

  const exactExists = options.some((o) => o.name.toLowerCase() === query.trim().toLowerCase())
  const customRegion = region !== 'Alle' ? region : undefined

  return (
    <div className="picker" role="dialog" aria-label={title}>
      <div className="picker-head">
        <h2>{title}</h2>
        <button className="btn primary small" onClick={onClose}>Fertig</button>
      </div>

      <input
        className="picker-search"
        type="search"
        placeholder={region === 'Alle' ? 'Übung suchen' : `In ${region} suchen`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="region-chips">
        {['Alle', ...REGIONS].map((r) => (
          <button key={r} className={'chip' + (region === r ? ' on' : '')} onClick={() => setRegion(r)}>
            {r}
          </button>
        ))}
      </div>

      <div className="picker-list">
        {query.trim() && !exactExists && (
          <button className="picker-item custom" onClick={() => { onPick(query.trim(), customRegion); setQuery('') }}>
            <span className="grow">
              „{query.trim()}“ als eigene Übung anlegen
              <span className="muted small"> · {customRegion ?? 'ohne Region'}</span>
            </span>
            <span className="picker-add">+</span>
          </button>
        )}

        {filtered.map((o) => {
          const isAdded = added.has(o.name.toLowerCase())
          return (
            <button
              key={o.name}
              className={'picker-item' + (isAdded ? ' added' : '')}
              onClick={() => onPick(o.name, o.region)}
            >
              <span className="grow">
                {o.name}
                <span className="muted small">
                  {region === 'Alle' && o.region ? ` · ${o.region}` : ''}
                  {o.known ? ' · bereits verwendet' : ''}
                </span>
              </span>
              <span className="picker-add">{isAdded ? '✓' : '+'}</span>
            </button>
          )
        })}

        {filtered.length === 0 && region !== 'Alle' && (
          <p className="muted small">
            Keine Treffer in {region}.{' '}
            <button className="link" onClick={() => setRegion('Alle')}>In allen Regionen suchen</button>
          </p>
        )}
      </div>
    </div>
  )
}

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').trim()
