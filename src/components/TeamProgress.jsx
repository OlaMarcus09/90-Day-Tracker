import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { streakEmoji, completionEmoji, allDoneMessage } from '../lib/emoji'
import { useAuth } from '../state/useAuth.jsx'
import { REACTIONS, NUDGE_EMOJI, sendNudge } from '../lib/nudges.js'

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
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [visibility, setVisibility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [sending, setSending] = useState(null) // user_id currently being nudged

  const handleNudge = useCallback(
    async (toUserId, emoji) => {
      if (!user?.id || toUserId === user.id) return
      setSending(toUserId)
      const result = await sendNudge({ fromUserId: user.id, toUserId, teamId: team.id, emoji })
      setSending(null)
      if (result.ok) {
        setToast(`${emoji} sent`)
        setTimeout(() => setToast(''), 2000)
      }
    },
    [user?.id, team.id],
  )

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

    // Live-update when anyone on the team logs a completion, and surface
    // nudges aimed at the current user as they arrive.
    const channel = supabase
      .channel(`team-progress-${team.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_logs', filter: `team_id=eq.${team.id}` },
        () => loadProgress(),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'nudges', filter: `to_user=eq.${user?.id}` },
        (payload) => {
          setToast(`${payload.new.emoji} A teammate nudged you`)
          setTimeout(() => setToast(''), 4000)
        },
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [team.id, loadProgress, user?.id])

  if (loading) {
    return (
      <div className="layout">
        <p className="muted">Loading team progress…</p>
      </div>
    )
  }

  return (
    <div className="layout">
      {toast && <div className="nudge-toast">{toast}</div>}

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

              {user?.id && row.user_id !== user.id && (
                <div className="row" style={{ gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="ghost-button"
                    style={{ padding: '0.3rem 0.7rem' }}
                    onClick={() => handleNudge(row.user_id, NUDGE_EMOJI)}
                    disabled={sending === row.user_id}
                    aria-label={`Nudge ${row.full_name || 'teammate'}`}
                  >
                    {NUDGE_EMOJI} Nudge
                  </button>
                  {REACTIONS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      type="button"
                      className="ghost-button"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '1rem' }}
                      onClick={() => handleNudge(row.user_id, emoji)}
                      disabled={sending === row.user_id}
                      aria-label={`Send ${label} to ${row.full_name || 'teammate'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
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