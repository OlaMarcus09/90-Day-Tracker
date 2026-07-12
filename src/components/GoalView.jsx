import { useState } from 'react'
import { useAppState } from '../state/useAppState.jsx'

function GoalView() {
  const { state, updateGoal } = useAppState()
  const [statement, setStatement] = useState(state.goal.statement || '')
  const [evidence, setEvidence] = useState(state.goal.evidence || '')
  const [goalDate, setGoalDate] = useState(state.goal.goalDate || '')
  const [saved, setSaved] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    updateGoal(statement, evidence, goalDate)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="card">
      <p className="eyebrow">Goal</p>
      <h1>Definiteness of purpose</h1>
      <p className="muted" style={{ fontSize: '0.85rem' }}>
        If it's not working, adjust the plan — not the goal.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          By this date
          <input type="date" value={goalDate} onChange={(event) => setGoalDate(event.target.value)} />
        </label>

        <label>
          I will have...
          <textarea
            rows={3}
            value={statement}
            onChange={(event) => setStatement(event.target.value)}
            placeholder="Launched SentiWatch with 10 real users"
          />
        </label>

        <label>
          Measured by...
          <input
            value={evidence}
            onChange={(event) => setEvidence(event.target.value)}
            placeholder="Live URL + signed-up users in DB"
          />
        </label>

        <button type="submit" className="primary-button">
          Save goal
        </button>
        {saved && <p className="success-pill">Saved</p>}
      </form>
    </section>
  )
}

export default GoalView