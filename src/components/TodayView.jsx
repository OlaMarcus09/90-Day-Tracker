import { useAppState } from '../state/useAppState.jsx'

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

  return (
    <section className="card">
      <p className="eyebrow">Today</p>
      <h1>Day {dayNumber || 1} of 90</h1>
      <p className="muted">
        {phase} phase · Streak {streaks.currentStreak} 🔥
      </p>

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

      {allDoneToday ? <p className="success-pill">All daily actions complete ✨</p> : null}
    </section>
  )
}

export default TodayView
