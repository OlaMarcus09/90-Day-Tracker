import { useState } from 'react'
import { useAppState } from '../state/useAppState.jsx'

const goalTemplate = 'By [date], I will have [outcome], measured by [evidence].'

function OnboardingFlow() {
  const { completeOnboarding } = useAppState()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [goalStatement, setGoalStatement] = useState(goalTemplate)
  const [checklist, setChecklist] = useState(['', '', ''])

  const updateChecklistItem = (index, value) => {
    setChecklist((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  const addChecklistItem = () => {
    setChecklist((prev) => (prev.length < 5 ? [...prev, ''] : prev))
  }

  const removeChecklistItem = (index) => {
    setChecklist((prev) => (prev.length > 3 ? prev.filter((_, i) => i !== index) : prev))
  }

  const readyChecklist = checklist.map((item) => item.trim()).filter(Boolean)
  const canContinue =
    name.trim() && startDate && goalStatement.trim() && readyChecklist.length >= 3

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canContinue) {
      return
    }

    completeOnboarding({
      name,
      startDate,
      goalStatement,
      checklistTexts: readyChecklist,
    })
  }

  return (
    <main className="layout">
      <section className="card">
        <h1>90-Day Tracker</h1>
        <p className="muted">Set your plan once, then show up daily.</p>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>

          <label>
            Day 1 start date
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>

          <label>
            Definiteness of purpose
            <textarea
              value={goalStatement}
              onChange={(event) => setGoalStatement(event.target.value)}
              rows={4}
              required
            />
          </label>

          <div>
            <div className="checklist-header">
              <h2>Daily nonnegotiables</h2>
              <button
                type="button"
                className="ghost-button"
                onClick={addChecklistItem}
                disabled={checklist.length >= 5}
              >
                + Add
              </button>
            </div>

            {checklist.map((item, index) => (
              <div className="row" key={`onboard-item-${index}`}>
                <input
                  value={item}
                  onChange={(event) => updateChecklistItem(index, event.target.value)}
                  placeholder={`Action ${index + 1}`}
                  required={index < 3}
                />
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => removeChecklistItem(index)}
                  disabled={checklist.length <= 3}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button type="submit" className="primary-button" disabled={!canContinue}>
            Start My 90 Days
          </button>
        </form>
      </section>
    </main>
  )
}

export default OnboardingFlow
