// Client helpers for team nudges & reactions. A nudge is a lightweight row in
// public.nudges — inserting one lets the recipient's realtime channel light up,
// and (once web push is live) triggers a push via the same VAPID infra used by
// daily reminders. Sending is deliberately fire-and-forget from the UI's view.

import { supabase } from './supabaseClient'

// The emoji a teammate can send. Kept small on purpose — this is a poke, not a
// chat. 'nudge' is the plain "you haven't checked in" tap; the rest are cheers.
export const REACTIONS = [
  { emoji: '👏', label: 'Cheer' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💪', label: 'Push' },
]

export const NUDGE_EMOJI = '👋'

/**
 * Inserts a nudge from the signed-in user to a teammate. Returns { ok, reason }.
 * The DB's RLS policy enforces that sender and recipient share a team, so we
 * don't re-check that here.
 */
export async function sendNudge({ fromUserId, toUserId, teamId, emoji }) {
  if (!fromUserId || !toUserId || !teamId) {
    return { ok: false, reason: 'missing-args' }
  }
  if (fromUserId === toUserId) {
    return { ok: false, reason: 'self' }
  }

  const { error } = await supabase.from('nudges').insert({
    from_user: fromUserId,
    to_user: toUserId,
    team_id: teamId,
    emoji: emoji || NUDGE_EMOJI,
  })

  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}
