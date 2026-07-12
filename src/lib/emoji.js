// Small, self-contained helpers for turning numbers into the emoji language
// the app uses everywhere — keeps the "feel" consistent between Today view,
// history, and the team progress cards instead of every component inventing
// its own emoji logic.

const FLAME_CAP = 5

/**
 * Turns a streak count into a flame string.
 * 0        -> "" (no streak yet, nothing to show)
 * 1-5      -> "🔥🔥🔥" (one flame per day, so it's satisfying to watch grow)
 * 6+       -> "🔥 x12" (avoids an unreadable wall of emoji past a handful)
 */
export function streakEmoji(streak) {
  if (!streak || streak <= 0) return ''
  if (streak <= FLAME_CAP) return '🔥'.repeat(streak)
  return `🔥 x${streak}`
}

/**
 * Turns completed/total into a row of filled/empty squares, e.g. "✅✅⬜⬜"
 * Caps at 8 squares and switches to a fraction beyond that so a 15-item
 * checklist doesn't produce a giant unreadable row.
 */
export function completionEmoji(completed, total) {
  if (!total) return ''
  if (total > 8) {
    return `${'✅'.repeat(Math.min(completed, total))} ${completed}/${total}`
  }
  return '✅'.repeat(completed) + '⬜'.repeat(Math.max(total - completed, 0))
}

const APP_URL = 'https://90-day-tracker-mu.vercel.app/'

/**
 * Builds the public, share-safe progress line — day number + streak only.
 * Deliberately excludes goal text, notes, and team name so sharing progress
 * never accidentally exposes anything personal.
 */
export function buildShareText(dayNumber, streak) {
  const flame = streak > 0 ? ` ${streakEmoji(streak)}` : ''
  return `Day ${dayNumber} of 90${flame} — tracking my 90-day goal with 90-Day Tracker`
}

/**
 * Share links for platforms without (or with unreliable) Web Share API
 * support. WhatsApp/Twitter accept raw text; LinkedIn/Facebook are
 * URL-based by design, so the share text isn't included there — normal
 * for those platforms.
 */
export function shareLinks(text) {
  const encodedText = encodeURIComponent(text)
  const encodedUrl = encodeURIComponent(APP_URL)
  return {
    whatsapp: `https://wa.me/?text=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  }
}

/**
 * The celebratory line shown when someone finishes every item for the day.
 * Cycles through a few variants so it doesn't feel robotic on day 47.
 */
const ALL_DONE_MESSAGES = ['🎉 All done today', '💯 Nailed it', '🌟 Full clear', '🙌 That is a wrap']

export function allDoneMessage(seed = 0) {
  return ALL_DONE_MESSAGES[seed % ALL_DONE_MESSAGES.length]
}

/**
 * Compact status emoji for a single day in a grid/history view.
 */
export function dayStatusEmoji(completed, total) {
  if (!total) return '·'
  if (completed === 0) return '⬜'
  if (completed === total) return '✅'
  return '🟡'
}