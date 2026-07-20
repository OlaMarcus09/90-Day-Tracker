// Compound — daily reminder sender.
//
// Runs hourly (via Supabase cron). For every push subscription whose LOCAL
// hour (derived from its stored timezone) equals the current hour, and whose
// owner hasn't completed today's checklist, send a web-push nudge.
//
// Deploy:  supabase functions deploy send-daily-reminders
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@…)
//          SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@compound.app'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

// The local hour right now in a given IANA timezone (0-23).
function localHourIn(timezone: string): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', hour12: false, timeZone: timezone,
    })
    return Number(fmt.format(new Date())) % 24
  } catch {
    return new Date().getUTCHours()
  }
}

// Local YYYY-MM-DD for a timezone — matches how the client keys daily_logs.
function localDateIn(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

Deno.serve(async () => {
  const { data: subs, error } = await admin.from('push_subscriptions').select('*')
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0
  let skipped = 0
  let pruned = 0

  for (const sub of subs ?? []) {
    const tz = sub.timezone || 'UTC'

    // Only fire in the user's chosen hour, in their own timezone.
    if (localHourIn(tz) !== sub.reminder_hour) {
      skipped += 1
      continue
    }

    // Skip if they've already completed everything today.
    const dateKey = localDateIn(tz)
    const { data: log } = await admin
      .from('daily_logs')
      .select('checks')
      .eq('user_id', sub.user_id)
      .eq('date', dateKey)
      .maybeSingle()

    const { count: itemCount } = await admin
      .from('checklist_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', sub.user_id)

    const total = itemCount ?? 0
    const done = log?.checks ? Object.values(log.checks).filter(Boolean).length : 0
    if (total > 0 && done >= total) {
      skipped += 1
      continue
    }

    const payload = JSON.stringify({
      title: 'Compound',
      body: done > 0
        ? `You're ${done}/${total} today — finish strong.`
        : 'Your daily nonnegotiables are waiting. Show up.',
      url: '/',
    })

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      )
      sent += 1
    } catch (err) {
      // 404/410 mean the subscription is dead — prune it so we stop trying.
      const statusCode = (err as { statusCode?: number }).statusCode
      if (statusCode === 404 || statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        pruned += 1
      }
    }
  }

  return new Response(JSON.stringify({ sent, skipped, pruned }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
