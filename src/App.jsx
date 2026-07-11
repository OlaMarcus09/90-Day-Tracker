import { useEffect, useState } from 'react'
import GoalView from './components/GoalView'
import HistoryView from './components/HistoryView'
import OnboardingFlow from './components/OnboardingFlow'
import Settings from './components/Settings'
import TodayView from './components/TodayView'
import WeeklyReview from './components/WeeklyReview'
import { useAppState } from './state/useAppState.jsx'
import './App.css'

const NAV_ITEMS = [
  { id: 'today', label: 'Today' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'history', label: 'History' },
  { id: 'goal', label: 'Goal' },
  { id: 'settings', label: 'Settings' },
]

function App() {
  const { isOnboarded, isWeeklyReviewDue } = useAppState()
  const [activeView, setActiveView] = useState('today')

  useEffect(() => {
    if (isOnboarded && isWeeklyReviewDue) {
      setActiveView('weekly')
    }
  }, [isOnboarded, isWeeklyReviewDue])

  if (!isOnboarded) {
    return <OnboardingFlow />
  }

  return (
    <main className="layout">
      {activeView === 'today' ? <TodayView /> : null}
      {activeView === 'weekly' ? <WeeklyReview /> : null}
      {activeView === 'history' ? <HistoryView /> : null}
      {activeView === 'goal' ? <GoalView /> : null}
      {activeView === 'settings' ? <Settings /> : null}

      <nav className="bottom-nav" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={activeView === item.id ? 'active' : ''}
            onClick={() => setActiveView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </main>
  )
}

export default App
