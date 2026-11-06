import { useState } from 'react'
import { activeSession, useAppData } from './store'
import TrainingView from './views/TrainingView'
import PlanView from './views/PlanView'
import ProgressView from './views/ProgressView'
import DataView from './views/DataView'

type Tab = 'training' | 'plan' | 'progress' | 'data'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'training', label: 'Training', icon: '🏋️' },
  { id: 'plan', label: 'Plan', icon: '📋' },
  { id: 'progress', label: 'Fortschritt', icon: '📈' },
  { id: 'data', label: 'Daten', icon: '💾' },
]

export default function App() {
  const [data, update] = useAppData()
  const [tab, setTab] = useState<Tab>('training')
  const running = activeSession(data)

  return (
    <div className="app">
      <main className="content">
        {tab === 'training' && <TrainingView data={data} update={update} goToPlan={() => setTab('plan')} />}
        {tab === 'plan' && <PlanView data={data} update={update} />}
        {tab === 'progress' && <ProgressView data={data} update={update} />}
        {tab === 'data' && <DataView data={data} update={update} />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'tab' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
            {t.id === 'training' && running && <span className="dot" />}
          </button>
        ))}
      </nav>
    </div>
  )
}
