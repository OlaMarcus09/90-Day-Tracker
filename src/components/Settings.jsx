import { useState } from 'react'
import { useAppState } from '../state/useAppState.jsx'

function Settings() {
  const { state, updateProfile, updateChecklist, exportData } = useAppState()

  const [name, setName] = useState(state.profile.name)
  const [startDate, setStartDate] = useState(state.profile.startDate)
  const [items, setItems] = useState(state.checklist.map((item) => item.text))

  const updateItem = (index, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  const addItem = () => setItems((prev) => (prev.length < 5 ? [...prev, ''] : prev))
  const removeItem = (index) =>
    setItems((prev) => (prev.length > 3 ? prev.filter((_, i) => i !== index) : prev))

  const handleSave = (event) => {
    event.preventDefault()
    updateProfile({ name, startDate })
    updateChecklist(items)
  }

  return (
    <section className="card">
      <p className="eyebrow">Settings</p>
      <h1>Profile and checklist</h1>

      <form className="form" onSubmit={handleSave}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label>
          Start date
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>

        <h2>Daily checklist</h2>
        {items.map((item, index) => (
          <div className="row" key={`settings-item-${index}`}>
            <input
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
              placeholder={`Action ${index + 1}`}
            />
            <button
              type="button"
              className="ghost-button"
              onClick={() => removeItem(index)}
              disabled={items.length <= 3}
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          className="ghost-button"
          onClick={addItem}
          disabled={items.length >= 5}
        >
          + Add checklist item
        </button>

        <button type="submit" className="primary-button">
          Save settings
        </button>
      </form>

      <button type="button" className="secondary-button" onClick={exportData}>
        Export data as JSON
      </button>
    </section>
  )
}

export default Settings
