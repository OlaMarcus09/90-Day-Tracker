import { useAppState } from '../state/useAppState.jsx'
import { streakEmoji, completionEmoji, allDoneMessage } from '../lib/emoji.js'
import ShareProgress from './ShareProgress.jsx'
import MilestoneCelebration from './MilestoneCelebration.jsx'

function TodayView() {
  const {
    state,
    dayNumber,
    phase,
    todayLog,
    streaks,
    allDoneToday,
    toggleTodayChecklist,
    updateTodayNote,
  } = useAppState()

  const completedCount = state.checklist.filter((item) => !!todayLog.checks?.[item.id]).length

  return (
    <section className="card">
      <p className="eyebrow" data-phase={phase.toLowerCase()}>{phase}</p>
      <h1>Day {dayNumber || 1} of 90</h1>
      <p className="muted">
        {streaks.currentStreak > 0 ? `Streak ${streaks.currentStreak} ${streakEmoji(streaks.currentStreak)}` : 'No streak yet — today starts it'}
      </p>
      {streaks.freezesRemaining > 0 ? (
        <p className="muted" style={{ fontSize: '0.8rem' }}>
          {'❄️'.repeat(streaks.freezesRemaining)} {streaks.freezesRemaining} freeze{streaks.freezesRemaining > 1 ? 's' : ''} banked — one missed day won't break your streak
        </p>
      ) : null}

      {state.goal.statement?.trim() ? (
        <div className="goal-reminder">
          <p className="eyebrow">Why you're here</p>
          <p>{state.goal.statement}</p>
        </div>
      ) : null}
      {state.checklist.length > 0 && (
        <p style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}>
          {completionEmoji(completedCount, state.checklist.length)}
        </p>
      )}

      <ul className="checklist">
        {state.checklist.map((item) => {
          const done = !!todayLog.checks?.[item.id]
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`check-item ${done ? 'done' : ''}`}
                onClick={() => toggleTodayChecklist(item.id)}
              >
                <span className="check-badge">✓</span>
                <span>{item.text}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <label>
        Optional note
        <textarea
          rows={3}
          value={todayLog.note || ''}
          onChange={(event) => updateTodayNote(event.target.value)}
          placeholder="What I did + how it went"
        />
      </label>

      {allDoneToday ? <p className="success-pill">{allDoneMessage(dayNumber)}</p> : null}

      <ShareProgress dayNumber={dayNumber || 1} streak={streaks.currentStreak} />

      <MilestoneCelebration dayNumber={dayNumber} currentStreak={streaks.currentStreak} />
    </section>
  )
}

export default TodayView