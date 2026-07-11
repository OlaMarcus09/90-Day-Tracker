import { useMemo, useState } from 'react'
import { useAppState } from '../state/useAppState.jsx'

const QUESTIONS = [
  'What moved forward this week?',
  'Where did I stall, and why?',
  'Is the goal still right, or does the plan need adjusting?',
  'One thing to change next week?',
]

function WeeklyReview() {
  const { currentWeek, saveWeeklyReview, state } = useAppState()

  const existing = useMemo(
    () => state.weeklyReviews.find((review) => review.weekNumber === currentWeek),
    [state.weeklyReviews, currentWeek],
  )

  const [answers, setAnswers] = useState(
    existing?.answers || QUESTIONS.reduce((acc, question) => ({ ...acc, [question]: '' }), {}),
  )

  const updateAnswer = (question, value) => {
    setAnswers((prev) => ({ ...prev, [question]: value }))
  }

  const handleSave = (event) => {
    event.preventDefault()
    saveWeeklyReview(answers)
  }

  return (
    <section className="card">
      <p className="eyebrow">Weekly Review</p>
      <h1>Week {currentWeek || 1}</h1>

      <form className="form" onSubmit={handleSave}>
        {QUESTIONS.map((question) => (
          <label key={question}>
            {question}
            <textarea
              rows={3}
              value={answers[question] || ''}
              onChange={(event) => updateAnswer(question, event.target.value)}
            />
          </label>
        ))}

        <button type="submit" className="primary-button">
          Save review
        </button>
      </form>

      <h2>History</h2>
      <div className="stack">
        {state.weeklyReviews.length === 0 ? <p className="muted">No weekly reviews yet.</p> : null}
        {[...state.weeklyReviews].reverse().map((review) => (
          <article key={review.id} className="mini-card">
            <p className="eyebrow">Week {review.weekNumber}</p>
            {QUESTIONS.map((question) => (
              <p key={`${review.id}-${question}`}>
                <strong>{question}</strong>
                <br />
                {review.answers?.[question] || '—'}
              </p>
            ))}
          </article>
        ))}
      </div>
    </section>
  )
}

export default WeeklyReview
