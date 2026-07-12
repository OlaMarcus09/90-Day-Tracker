import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth.jsx'

const PHASES = [
  { name: 'Foundation', min: 1, max: 30 },
  { name: 'Momentum', min: 31, max: 60 },
  { name: 'Compound', min: 61, max: 90 },
]

const AppStateContext = createContext(null)

const getLocalDateString = (date = new Date()) => {
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - timezoneOffset).toISOString().split('T')[0]
}

const diffDaysInclusive = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
}

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return getLocalDateString(date)
}

const calculateStreaks = (dailyLogs, checklist, startDate, endDate, today) => {
  if (!startDate || !checklist.length) return { currentStreak: 0, longestStreak: 0 }
  const allIds = checklist.map((item) => item.id)
  const dates = []
  let cursor = startDate
  while (cursor <= endDate && cursor <= today) {
    dates.push(cursor)
    cursor = addDays(cursor, 1)
  }
  let longest = 0
  let running = 0
  dates.forEach((dateKey) => {
    const log = dailyLogs[dateKey]
    const completed = !!log && allIds.length > 0 && allIds.every((id) => !!log.checks?.[id])
    if (completed) {
      running += 1
      longest = Math.max(longest, running)
    } else {
      running = 0
    }
  })
  let current = 0
  for (let i = dates.length - 1; i >= 0; i -= 1) {
    const log = dailyLogs[dates[i]]
    const completed = !!log && allIds.length > 0 && allIds.every((id) => !!log.checks?.[id])
    if (!completed) break
    current += 1
  }
  return { currentStreak: current, longestStreak: longest }
}

// NOTE: startDate is now team.start_date (shared across the team), not a
// per-user field — so this Provider needs the team object passed in as a
// prop, and must be rendered AFTER the team is known (i.e. inside App.jsx,
// not globally in main.jsx like before).
export function AppStateProvider({ children, team }) {
  const { user } = useAuth()
  const [checklist, setChecklist] = useState([])
  const [goal, setGoal] = useState({ statement: '', evidence: '', goalDate: '' })
  const [dailyLogs, setDailyLogs] = useState({})
  const [weeklyReviews, setWeeklyReviews] = useState([])
  const [loaded, setLoaded] = useState(false)

  const teamId = team?.id
  const startDate = team?.start_date || ''
  const endDate = startDate ? addDays(startDate, 89) : ''
  const userId = user?.id
  const userName = user?.user_metadata?.full_name || ''

  const loadAll = useCallback(async () => {
    if (!teamId || !userId) return
    setLoaded(false)

    const [{ data: items }, { data: goalRow }, { data: logs }, { data: reviews }] = await Promise.all([
      supabase
        .from('checklist_items')
        .select('*')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .eq('archived', false)
        .order('sort_order'),
      supabase.from('goals').select('*').eq('team_id', teamId).eq('user_id', userId).maybeSingle(),
      supabase.from('daily_logs').select('*').eq('team_id', teamId).eq('user_id', userId),
      supabase
        .from('weekly_reviews')
        .select('*')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .order('week_number'),
    ])

    setChecklist(items || [])
    setGoal({
      statement: goalRow?.outcome || '',
      evidence: goalRow?.evidence || '',
      goalDate: goalRow?.goal_date || '',
    })

    const logsByDate = {}
    ;(logs || []).forEach((log) => {
      logsByDate[log.log_date] = { checks: log.completed || {}, note: log.note || '' }
    })
    setDailyLogs(logsByDate)

    setWeeklyReviews(
      (reviews || []).map((r) => ({
        id: r.id,
        weekNumber: r.week_number,
        answers: { q1: r.q1, q2: r.q2, q3: r.q3, q4: r.q4 },
      })),
    )
    setLoaded(true)
  }, [teamId, userId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const today = getLocalDateString()
  const dayNumber = startDate ? diffDaysInclusive(startDate, today) : 0
  const boundedDay = Math.max(0, Math.min(dayNumber, 90))
  const phase = PHASES.find((p) => boundedDay >= p.min && boundedDay <= p.max)?.name || 'Setup'

  const todayLog = dailyLogs[today] || { checks: {}, note: '' }
  const allDoneToday = checklist.length > 0 && checklist.every((item) => !!todayLog.checks?.[item.id])
  const streaks = calculateStreaks(dailyLogs, checklist, startDate, endDate, today)

  const isOnboarded = !!userName && !!startDate && !!goal.statement && checklist.length >= 3

  const currentWeek = boundedDay > 0 ? Math.ceil(boundedDay / 7) : 0
  const hasCurrentWeekReview = weeklyReviews.some((r) => r.weekNumber === currentWeek)
  const isWeeklyReviewDue = currentWeek > 0 && !hasCurrentWeekReview

  const completeOnboarding = useCallback(
    async ({ goalStatement, goalEvidence, goalDate, checklistTexts }) => {
      const items = checklistTexts.map((t) => t.trim()).filter(Boolean).slice(0, 5)

      const { error: goalError } = await supabase
        .from('goals')
        .upsert(
          { team_id: teamId, user_id: userId, outcome: goalStatement.trim(), evidence: goalEvidence?.trim() || '', goal_date: goalDate || null },
          { onConflict: 'team_id,user_id' },
        )
      if (goalError) {
        console.error('completeOnboarding: failed to save goal', goalError)
        throw goalError
      }

      const { error: deleteError } = await supabase
        .from('checklist_items')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId)
      if (deleteError) {
        console.error('completeOnboarding: failed to clear old checklist', deleteError)
        throw deleteError
      }

      if (items.length) {
        const { error: insertError } = await supabase
          .from('checklist_items')
          .insert(items.map((text, index) => ({ team_id: teamId, user_id: userId, text, sort_order: index })))
        if (insertError) {
          console.error('completeOnboarding: failed to save checklist', insertError)
          throw insertError
        }
      }

      await loadAll()
    },
    [teamId, userId, loadAll],
  )

  const toggleTodayChecklist = useCallback(
    async (itemId) => {
      const current = dailyLogs[today] || { checks: {}, note: '' }
      const nextChecks = { ...current.checks, [itemId]: !current.checks?.[itemId] }

      setDailyLogs((prev) => ({ ...prev, [today]: { ...current, checks: nextChecks } })) // optimistic

      await supabase
        .from('daily_logs')
        .upsert(
          { team_id: teamId, user_id: userId, log_date: today, completed: nextChecks, note: current.note || '' },
          { onConflict: 'team_id,user_id,log_date' },
        )
    },
    [teamId, userId, today, dailyLogs],
  )

  const updateTodayNote = useCallback(
    async (note) => {
      const current = dailyLogs[today] || { checks: {}, note: '' }
      setDailyLogs((prev) => ({ ...prev, [today]: { ...current, note } })) // optimistic

      await supabase
        .from('daily_logs')
        .upsert(
          { team_id: teamId, user_id: userId, log_date: today, completed: current.checks, note },
          { onConflict: 'team_id,user_id,log_date' },
        )
    },
    [teamId, userId, today, dailyLogs],
  )

  const saveWeeklyReview = useCallback(
    async (answers) => {
      if (!currentWeek) return
      await supabase
        .from('weekly_reviews')
        .upsert(
          { team_id: teamId, user_id: userId, week_number: currentWeek, q1: answers.q1, q2: answers.q2, q3: answers.q3, q4: answers.q4 },
          { onConflict: 'team_id,user_id,week_number' },
        )
      await loadAll()
    },
    [teamId, userId, currentWeek, loadAll],
  )

  const updateGoal = useCallback(
    async (statement, evidence, goalDate) => {
      const clean = statement.trim()
      if (!clean) return
      await supabase
        .from('goals')
        .upsert(
          { team_id: teamId, user_id: userId, outcome: clean, evidence: evidence?.trim() ?? goal.evidence, goal_date: goalDate ?? goal.goalDate },
          { onConflict: 'team_id,user_id' },
        )
      await loadAll()
    },
    [teamId, userId, goal, loadAll],
  )

  const updateChecklist = useCallback(
    async (items) => {
      const normalized = items.map((t) => t.trim()).filter(Boolean).slice(0, 5)
      await supabase.from('checklist_items').delete().eq('team_id', teamId).eq('user_id', userId)
      if (normalized.length) {
        await supabase
          .from('checklist_items')
          .insert(normalized.map((text, index) => ({ team_id: teamId, user_id: userId, text, sort_order: index })))
      }
      await loadAll()
    },
    [teamId, userId, loadAll],
  )

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify({ goal, checklist, dailyLogs, weeklyReviews }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `90-day-tracker-export-${today}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [goal, checklist, dailyLogs, weeklyReviews, today])

  const value = useMemo(
    () => ({
      state: { profile: { name: userName, startDate, endDate }, goal, checklist, dailyLogs, weeklyReviews },
      today,
      dayNumber: boundedDay,
      phase,
      todayLog,
      allDoneToday,
      streaks,
      currentWeek,
      isWeeklyReviewDue,
      isOnboarded,
      loaded,
      completeOnboarding,
      toggleTodayChecklist,
      updateTodayNote,
      saveWeeklyReview,
      updateGoal,
      updateChecklist,
      exportData,
    }),
    [
      userName, startDate, endDate, goal, checklist, dailyLogs, weeklyReviews,
      today, boundedDay, phase, todayLog, allDoneToday, streaks,
      currentWeek, isWeeklyReviewDue, isOnboarded, loaded,
      completeOnboarding, toggleTodayChecklist, updateTodayNote,
      saveWeeklyReview, updateGoal, updateChecklist, exportData,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used inside AppStateProvider')
  return context
}