import { useMemo } from 'react'
import { useAppState } from '../state/useAppState.jsx'

function HistoryView() {
  const { state, dayNumber, streaks } = useAppState()

  const days = useMemo(() => {
    const totalDays = 90
    const checklistIds = state.checklist.map((item) => item.id)

    // Chronological order — an honest calendar. Hiding missed days at the back
    // (the old behavior) made a bad week disappear, which quietly told people
    // their misses didn't count. Seeing the real timeline is what makes showing
    // up again meaningful.
    return Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1
      if (day > dayNumber) {
        return { day, status: 'future' }
      }

      const date = new Date(`${state.profile.startDate}T00:00:00`)
      date.setDate(date.getDate() + index)
      const dateKey = date.toISOString().split('T')[0]
      const log = state.dailyLogs[dateKey]

      if (!log) {
        return { day, status: 'missed' }
      }

      const checks = checklistIds.map((id) => !!log.checks?.[id])
      const doneCount = checks.filter(Boolean).length

      if (doneCount === checklistIds.length && checklistIds.length > 0) {
        return { day, status: 'complete' }
      }
      if (doneCount > 0) {
        return { day, status: 'partial' }
      }
      return { day, status: 'missed' }
    })
  }, [state, dayNumber])

  const progressPercent = Math.max(0, Math.min((dayNumber / 90) * 100, 100))

  return (
    <section className="card">
      <p className="eyebrow">Progress</p>
      <h1>History</h1>
      <p className="muted">
        Current streak: {streaks.currentStreak} · Longest streak: {streaks.longestStreak}
        {streaks.freezesRemaining > 0 ? ` · ${'❄️'.repeat(streaks.freezesRemaining)} ${streaks.freezesRemaining} freeze${streaks.freezesRemaining > 1 ? 's' : ''}` : ''}
      </p>

      <div className="phase-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progressPercent)}>
        <div className="phase-progress" style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="muted">Foundation → Momentum → Compound</p>

      <div className="history-grid">
        {days.map((item) => (
          <div key={item.day} className={`day-pill ${item.status}`}>
            {item.day}
          </div>
        ))}
      </div>
    </section>
  )
}

export default HistoryView
