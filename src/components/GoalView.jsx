import { useState } from 'react'
import { useAppState } from '../state/useAppState.jsx'

function GoalView() {
  const { state, updateGoal } = useAppState()
  const [value, setValue] = useState(state.goal.statement)

  const handleSubmit = (event) => {
    event.preventDefault()
    updateGoal(value)
  }

  return (
    <section className="card">
      <p className="eyebrow">Goal</p>
      <h1>Definiteness of purpose</h1>

      <form className="form" onSubmit={handleSubmit}>
        <textarea rows={4} value={value} onChange={(event) => setValue(event.target.value)} />
        <button type="submit" className="primary-button">
          Save goal
        </button>
      </form>

      <h2>Edit history</h2>
      <div className="stack">
        {[...state.goal.history].reverse().map((entry, index) => (
          <article className="mini-card" key={`${entry.editedAt}-${index}`}>
            <p className="eyebrow">{new Date(entry.editedAt).toLocaleString()}</p>
            <p>{entry.statement}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default GoalView
