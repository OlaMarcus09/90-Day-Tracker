import { useState } from 'react'
import { useAppState } from '../state/useAppState.jsx'

function Settings({ onSignOut }) {
  const { state, updateChecklist, exportData } = useAppState()

  const [items, setItems] = useState(state.checklist.map((item) => item.text))
  const [saved, setSaved] = useState(false)

  const updateItem = (index, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  const addItem = () => setItems((prev) => (prev.length < 5 ? [...prev, ''] : prev))
  const removeItem = (index) =>
    setItems((prev) => (prev.length > 3 ? prev.filter((_, i) => i !== index) : prev))

  const handleSave = (event) => {
    event.preventDefault()
    updateChecklist(items)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="card">
      <p className="eyebrow">Settings</p>
      <h1>Profile and checklist</h1>

      <div className="mini-card">
        <p className="muted" style={{ fontSize: '0.82rem' }}>
          Name: <strong>{state.profile.name || '—'}</strong>
        </p>
        <p className="muted" style={{ fontSize: '0.82rem' }}>
          Team start date: <strong>{state.profile.startDate || '—'}</strong>
        </p>
        <p className="muted" style={{ fontSize: '0.75rem' }}>
          Your name comes from your account, and the start date is shared by the whole team — neither
          is editable from here.
        </p>
      </div>

      <form className="form" onSubmit={handleSave}>
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
        {saved && <p className="success-pill">Saved</p>}
      </form>

      <button type="button" className="secondary-button" onClick={exportData}>
        Export data as JSON
      </button>

      {onSignOut && (
        <button type="button" className="ghost-button" onClick={onSignOut}>
          Sign out
        </button>
      )}
    </section>
  )
}

export default Settings