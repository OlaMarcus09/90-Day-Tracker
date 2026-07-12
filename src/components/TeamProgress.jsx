import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { streakEmoji, completionEmoji, allDoneMessage } from '../lib/emoji'

function InviteCode({ code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mini-card" style={{ marginBottom: '1.2rem' }}>
      <p className="eyebrow">Invite code</p>
      <div className="row">
        <p style={{ fontSize: '1.3rem', fontFamily: 'monospace', letterSpacing: '0.08em' }}>{code}</p>
        <button type="button" className="ghost-button" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="muted" style={{ fontSize: '0.75rem' }}>
        Share this with your partner or group — they'll enter it under "Join with a code."
      </p>
    </div>
  )
}

export default function TeamProgress({ team }) {
  const [rows, setRows] = useState([])
  const [visibility, setVisibility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProgress = useCallback(async () => {
    setError('')
    try {
      const [{ data: vis, error: visError }, { data: summary, error: summaryError }] = await Promise.all([
        supabase.from('team_visibility_settings').select('*').eq('team_id', team.id).single(),
        supabase.rpc('get_team_progress_summary', { target_team_id: team.id }),
      ])

      if (visError) throw visError
      setVisibility(vis)

      if (summaryError) {
        // Most likely cause: show_completion is off for this team.
        setRows([])
        setError('Completion visibility is off for this team.')
      } else {
        setRows(summary || [])
      }
    } catch (err) {
      setError(err.message || 'Could not load team progress.')
    } finally {
      setLoading(false)
    }
  }, [team.id])

  useEffect(() => {
    loadProgress()

    // Live-update when anyone on the team logs a completion.
    const channel = supabase
      .channel(`team-progress-${team.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_logs', filter: `team_id=eq.${team.id}` },
        () => loadProgress(),
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [team.id, loadProgress])

  if (loading) {
    return (
      <div className="layout">
        <p className="muted">Loading team progress…</p>
      </div>
    )
  }

  return (
    <div className="layout">
      <p className="eyebrow">{team.name}</p>
      <h1 style={{ fontSize: '1.5rem', marginTop: '0.3rem', marginBottom: '1.2rem' }}>Team progress today</h1>

      <InviteCode code={team.invite_code} />

      {error && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <p className="muted">{error}</p>
        </div>
      )}

      <div className="stack">
        {rows.map((row) => {
          const allDone = row.total_count > 0 && row.completed_count === row.total_count
          return (
            <div className="card" key={row.user_id} style={{ display: 'grid', gap: '0.5rem' }}>
              <div className="row">
                <strong>{row.full_name || 'Teammate'}</strong>
                <span style={{ fontSize: '1rem' }}>{streakEmoji(row.current_streak)}</span>
              </div>

              <div style={{ fontSize: '1.15rem', letterSpacing: '0.05em' }}>
                {completionEmoji(row.completed_count, row.total_count)}
              </div>

              {allDone ? (
                <p className="success-pill">{allDoneMessage(row.user_id.charCodeAt(0))}</p>
              ) : (
                <p className="muted" style={{ fontSize: '0.82rem' }}>
                  {row.completed_count}/{row.total_count} done today
                </p>
              )}
            </div>
          )
        })}

        {rows.length === 0 && !error && (
          <p className="muted">No teammates yet — share your invite code to get someone in here.</p>
        )}
      </div>

      {visibility && !visibility.show_tasks && (
        <p className="muted" style={{ fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
          Task details are private for this team — only completion counts are shared.
        </p>
      )}
    </div>
  )
}