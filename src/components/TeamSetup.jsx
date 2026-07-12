import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function TeamSetup({ onTeamReady }) {
  const [tab, setTab] = useState('create') // 'create' | 'join'
  const [teamName, setTeamName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const { data, error: rpcError } = await supabase.rpc('create_team', {
        team_name: teamName.trim(),
        team_start_date: startDate,
      })
      if (rpcError) throw rpcError
      onTeamReady(data)
    } catch (err) {
      setError(err.message || 'Could not create the team.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const { data, error: rpcError } = await supabase.rpc('join_team_with_code', {
        code: inviteCode.trim().toLowerCase(),
      })
      if (rpcError) throw rpcError
      onTeamReady(data)
    } catch (err) {
      setError(err.message?.includes('Invalid') ? 'That invite code doesn\'t match any team.' : err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="layout">
      <div style={{ marginTop: '2.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <p className="eyebrow">One more step</p>
        <h1 style={{ fontSize: '1.6rem', marginTop: '0.3rem' }}>Start solo or with a team</h1>
        <p className="muted" style={{ marginTop: '0.4rem' }}>
          A team can be just the two of you, or a small group — everyone shares the same 90-day window.
        </p>
      </div>

      <div className="row" style={{ marginBottom: '1rem', gap: '0.5rem' }}>
        <button
          className={tab === 'create' ? 'primary-button' : 'ghost-button'}
          onClick={() => setTab('create')}
          type="button"
        >
          Create a team
        </button>
        <button
          className={tab === 'join' ? 'primary-button' : 'ghost-button'}
          onClick={() => setTab('join')}
          type="button"
        >
          Join with a code
        </button>
      </div>

      {tab === 'create' ? (
        <form className="card form" onSubmit={handleCreate}>
          <label>
            Team name
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Marcus & Justina — Q1 push"
              required
            />
          </label>
          <label>
            Start date (Day 1)
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
          {error && <p style={{ color: '#c97b6a', fontSize: '0.85rem' }}>{error}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create team'}
          </button>
          <p className="muted" style={{ fontSize: '0.78rem' }}>
            You'll get an invite code on the next screen to share with your partner or group.
          </p>
        </form>
      ) : (
        <form className="card form" onSubmit={handleJoin}>
          <label>
            Invite code
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g. 8f3a2c1d"
              required
            />
          </label>
          {error && <p style={{ color: '#c97b6a', fontSize: '0.85rem' }}>{error}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Joining…' : 'Join team'}
          </button>
        </form>
      )}
    </div>
  )
}