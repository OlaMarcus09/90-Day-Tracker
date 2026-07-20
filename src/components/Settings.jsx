import { useEffect, useState } from 'react'
import { useAppState } from '../state/useAppState.jsx'
import { useAuth } from '../state/useAuth.jsx'
import {
  pushSupported,
  pushPermission,
  enablePush,
  disablePush,
  updateReminderHour,
  isSubscribed,
} from '../lib/push.js'

const REASON_MESSAGES = {
  unsupported: 'This browser does not support reminders.',
  'missing-vapid-key': 'Reminders are not configured yet.',
  denied: 'Notifications are blocked — enable them in your browser settings.',
}

const reasonToMessage = (reason) => REASON_MESSAGES[reason] || reason || 'Could not update reminders.'

function Settings({ onSignOut }) {
  const { state, teamId, updateChecklist, exportData } = useAppState()
  const { user } = useAuth()

  const [items, setItems] = useState(state.checklist.map((item) => item.text))
  const [saved, setSaved] = useState(false)

  const supported = pushSupported()
  const [reminderOn, setReminderOn] = useState(false)
  const [reminderHour, setReminderHour] = useState(8)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState('')

  useEffect(() => {
    if (!supported) return
    isSubscribed().then(setReminderOn)
  }, [supported])

  const handleToggleReminders = async () => {
    setPushError('')
    setPushBusy(true)
    try {
      if (reminderOn) {
        const result = await disablePush()
        if (result.ok) setReminderOn(false)
        else setPushError(reasonToMessage(result.reason))
      } else {
        const result = await enablePush({ userId: user?.id, teamId, reminderHour })
        if (result.ok) setReminderOn(true)
        else setPushError(reasonToMessage(result.reason))
      }
    } finally {
      setPushBusy(false)
    }
  }

  const handleHourChange = async (nextHour) => {
    setReminderHour(nextHour)
    if (reminderOn) {
      setPushBusy(true)
      try {
        const result = await updateReminderHour({ reminderHour: nextHour })
        if (!result.ok) setPushError(reasonToMessage(result.reason))
      } finally {
        setPushBusy(false)
      }
    }
  }

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

      <div className="mini-card">
        <p className="eyebrow">Daily reminder</p>
        {supported ? (
          <>
            <div className="row">
              <span style={{ fontSize: '0.9rem' }}>
                {reminderOn ? 'On — a nudge if you have not checked in' : 'Off'}
              </span>
              <button
                type="button"
                className={reminderOn ? 'ghost-button' : 'primary-button'}
                onClick={handleToggleReminders}
                disabled={pushBusy}
              >
                {pushBusy ? '…' : reminderOn ? 'Turn off' : 'Turn on'}
              </button>
            </div>
            <label style={{ marginTop: '0.6rem' }}>
              Remind me around
              <select
                value={reminderHour}
                onChange={(event) => handleHourChange(Number(event.target.value))}
                disabled={pushBusy}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                  </option>
                ))}
              </select>
            </label>
            {pushError && (
              <p style={{ color: '#c97b6a', fontSize: '0.8rem', marginTop: '0.4rem' }}>{pushError}</p>
            )}
            {pushPermission() === 'denied' && (
              <p className="muted" style={{ fontSize: '0.72rem', marginTop: '0.4rem' }}>
                Notifications are blocked in your browser settings — you will need to re-allow them there.
              </p>
            )}
          </>
        ) : (
          <p className="muted" style={{ fontSize: '0.8rem' }}>
            Reminders are not supported in this browser. Try installing Compound to your home screen.
          </p>
        )}
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