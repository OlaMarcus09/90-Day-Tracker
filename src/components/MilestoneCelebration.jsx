import { useEffect, useState } from 'react'

// Milestones that deserve a moment. Two kinds:
//  - 'day'    → crossing into a new phase (or finishing all 90)
//  - 'streak' → hitting a streak threshold
// Each has a stable `id` so we only ever celebrate it once per user (tracked in
// localStorage). The list is ordered so that when several are newly crossed at
// once, we show the most significant (highest threshold) one.
const DAY_MILESTONES = [
  { id: 'day-31', day: 31, emoji: '🌱', title: 'Momentum phase', body: 'Foundation complete. The hard part — starting — is behind you. Now you build speed.' },
  { id: 'day-61', day: 61, emoji: '📈', title: 'Compound phase', body: 'Days 61–90. This is where consistent effort starts paying off in a way you can feel.' },
  { id: 'day-90', day: 90, emoji: '🏆', title: '90 days done', body: 'You showed up for 90 days. Whatever the numbers say, that consistency is the win.' },
]

const STREAK_MILESTONES = [
  { id: 'streak-7', streak: 7, emoji: '🔥', title: '7-day streak', body: 'A full week without missing. This is what a habit looks like taking hold.' },
  { id: 'streak-14', streak: 14, emoji: '🔥🔥', title: '14-day streak', body: 'Two weeks straight. You are past the point where most people quit.' },
  { id: 'streak-30', streak: 30, emoji: '⚡', title: '30-day streak', body: 'A month of showing up every single day. This is momentum you can bank on.' },
  { id: 'streak-50', streak: 50, emoji: '💫', title: '50-day streak', body: 'Fifty days. This isn’t motivation anymore — it’s who you are now.' },
  { id: 'streak-90', streak: 90, emoji: '👑', title: '90-day streak', body: 'A perfect run. Ninety days, zero misses. Extraordinary.' },
]

const STORAGE_KEY = 'compound_celebrated_milestones'

const getCelebrated = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

const markCelebrated = (id) => {
  const seen = getCelebrated()
  seen.add(id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]))
  } catch {
    // localStorage unavailable (private mode etc.) — worst case the user sees
    // the same celebration again later. Not worth failing over.
  }
}

// Returns the single most significant newly-crossed, not-yet-celebrated
// milestone, or null. Day milestones outrank streaks when both land together.
function findPendingMilestone(dayNumber, currentStreak) {
  const seen = getCelebrated()

  const dayHit = [...DAY_MILESTONES].reverse().find((m) => dayNumber >= m.day && !seen.has(m.id))
  if (dayHit) return dayHit

  const streakHit = [...STREAK_MILESTONES].reverse().find((m) => currentStreak >= m.streak && !seen.has(m.id))
  return streakHit || null
}

export default function MilestoneCelebration({ dayNumber, currentStreak }) {
  const [milestone, setMilestone] = useState(null)

  useEffect(() => {
    if (!dayNumber) return
    const pending = findPendingMilestone(dayNumber, currentStreak)
    if (pending) setMilestone(pending)
  }, [dayNumber, currentStreak])

  if (!milestone) return null

  const dismiss = () => {
    markCelebrated(milestone.id)
    setMilestone(null)
  }

  return (
    <div className="milestone-overlay" role="dialog" aria-modal="true" aria-label={milestone.title} onClick={dismiss}>
      <div className="milestone-card" onClick={(e) => e.stopPropagation()}>
        <p className="milestone-emoji" aria-hidden="true">{milestone.emoji}</p>
        <h2>{milestone.title}</h2>
        <p className="muted">{milestone.body}</p>
        <button type="button" className="primary-button" onClick={dismiss}>
          Keep going
        </button>
      </div>
    </div>
  )
}
