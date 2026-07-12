import { useCallback, useEffect, useState } from 'react'
import GoalView from './components/GoalView'
import HistoryView from './components/HistoryView'
import OnboardingFlow from './components/OnboardingFlow'
import Settings from './components/Settings'
import TodayView from './components/TodayView'
import WeeklyReview from './components/WeeklyReview'
import AuthScreen from './components/AuthScreen'
import TeamSetup from './components/TeamSetup'
import TeamProgress from './components/TeamProgress'
import { AppStateProvider, useAppState } from './state/useAppState.jsx'
import { useAuth } from './state/useAuth.jsx'
import { supabase } from './lib/supabaseClient'
import './App.css'

const NAV_ITEMS = [
  { id: 'today', label: 'Today' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'history', label: 'History' },
  { id: 'team', label: 'Team' },
  { id: 'goal', label: 'Goal' },
  { id: 'settings', label: 'Settings' },
]

// Only rendered once we have a confirmed team — this is what lets
// AppStateProvider receive a real team.id instead of undefined.
function AuthenticatedApp({ team, signOut }) {
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
      {activeView === 'team' ? <TeamProgress team={team} /> : null}
      {activeView === 'goal' ? <GoalView /> : null}
      {activeView === 'settings' ? <Settings onSignOut={signOut} /> : null}

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

function App() {
  const { isAuthenticated, loading: authLoading, user, signOut } = useAuth()
  const [team, setTeam] = useState(null)
  const [teamLoading, setTeamLoading] = useState(true)

  // Looks up whether the signed-in user already belongs to a team.
  // Assumes one team per user for now — revisit if multi-team support is wanted later.
  const loadTeam = useCallback(async () => {
    if (!user) {
      setTeam(null)
      setTeamLoading(false)
      return
    }

    setTeamLoading(true)
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id, teams(*)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    setTeam(!error && data?.teams ? data.teams : null)
    setTeamLoading(false)
  }, [user])

  useEffect(() => {
    loadTeam()
  }, [loadTeam])

  if (authLoading) {
    return (
      <main className="layout">
        <p className="muted">Loading…</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  if (teamLoading) {
    return (
      <main className="layout">
        <p className="muted">Loading your team…</p>
      </main>
    )
  }

  if (!team) {
    return <TeamSetup onTeamReady={setTeam} />
  }

  return (
    <AppStateProvider team={team}>
      <AuthenticatedApp team={team} signOut={signOut} />
    </AppStateProvider>
  )
}

export default App