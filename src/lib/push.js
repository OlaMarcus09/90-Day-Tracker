// Client-side helpers for opting into web push. The heavy lifting (deciding
// WHO to notify and WHEN) happens server-side in the send-daily-reminders Edge
// Function — this file only handles permission + subscription bookkeeping.

import { supabase } from './supabaseClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Web Push wants the VAPID key as a Uint8Array, but env vars are base64url
// strings — this converts between the two.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function pushPermission() {
  return pushSupported() ? Notification.permission : 'unsupported'
}

/** True if this device already has an active push subscription. */
export async function isSubscribed() {
  if (!pushSupported()) return false
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return !!subscription
}

// Turns a PushSubscription's binary keys into the base64 strings the server
// needs to encrypt payloads.
function extractKeys(subscription) {
  const raw = subscription.toJSON()
  return { p256dh: raw.keys?.p256dh, auth: raw.keys?.auth }
}

/**
 * Requests permission, subscribes via the SW registration, and upserts the
 * subscription into Supabase keyed by endpoint (so re-subscribing on the same
 * device updates rather than duplicates). Returns { ok, reason }.
 */
export async function enablePush({ userId, teamId, reminderHour }) {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' }
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: 'missing-vapid-key' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  const registration = await navigator.serviceWorker.ready

  // Reuse an existing browser subscription if present, else create one.
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const { p256dh, auth } = extractKeys(subscription)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      team_id: teamId,
      endpoint: subscription.endpoint,
      p256dh,
      auth,
      reminder_hour: reminderHour,
      timezone,
    },
    { onConflict: 'endpoint' },
  )

  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}

/** Updates just the reminder hour for this device's existing subscription. */
export async function updateReminderHour({ reminderHour }) {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' }
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return { ok: false, reason: 'not-subscribed' }

  const { error } = await supabase
    .from('push_subscriptions')
    .update({ reminder_hour: reminderHour })
    .eq('endpoint', subscription.endpoint)

  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}

/** Unsubscribes locally and removes the row from Supabase. */
export async function disablePush() {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' }
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return { ok: true }

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  return { ok: true }
}
