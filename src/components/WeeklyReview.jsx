import { useMemo, useState } from 'react'
import { useAppState } from '../state/useAppState.jsx'

const QUESTIONS = [
  { key: 'q1', label: 'What moved forward this week?' },
  { key: 'q2', label: 'Where did I stall, and why?' },
  { key: 'q3', label: 'Is the goal still right, or does the plan need adjusting?' },
  { key: 'q4', label: 'One thing to change next week?' },
]

function WeeklyReview() {
  const { currentWeek, saveWeeklyReview, state } = useAppState()

  const existing = useMemo(
    () => state.weeklyReviews.find((review) => review.weekNumber === currentWeek),
    [state.weeklyReviews, currentWeek],
  )

  const [answers, setAnswers] = useState(
    existing?.answers || { q1: '', q2: '', q3: '', q4: '' },
  )
  const [saved, setSaved] = useState(false)

  const updateAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = (event) => {
    event.preventDefault()
    saveWeeklyReview(answers)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!currentWeek) {
    return (
      <section className="card">
        <p className="eyebrow">Weekly Review</p>
        <h1>Not started yet</h1>
        <p className="muted">
          Your team's Day 1 hasn't arrived yet — weekly reviews unlock once the 90 days are underway.
        </p>
      </section>
    )
  }

  return (
    <section className="card">
      <p className="eyebrow">Weekly Review</p>
      <h1>Week {currentWeek}</h1>

      <form className="form" onSubmit={handleSave}>
        {QUESTIONS.map((question) => (
          <label key={question.key}>
            {question.label}
            <textarea
              rows={3}
              value={answers[question.key] || ''}
              onChange={(event) => updateAnswer(question.key, event.target.value)}
            />
          </label>
        ))}

        <button type="submit" className="primary-button">
          Save review
        </button>
        {saved && <p className="success-pill">Saved</p>}
      </form>

      <h2>History</h2>
      <div className="stack">
        {state.weeklyReviews.length === 0 ? <p className="muted">No weekly reviews yet.</p> : null}
        {[...state.weeklyReviews].reverse().map((review) => (
          <article key={review.id} className="mini-card">
            <p className="eyebrow">Week {review.weekNumber}</p>
            {QUESTIONS.map((question) => (
              <p key={`${review.id}-${question.key}`}>
                <strong>{question.label}</strong>
                <br />
                {review.answers?.[question.key] || '—'}
              </p>
            ))}
          </article>
        ))}
      </div>
    </section>
  )
}

export default WeeklyReview