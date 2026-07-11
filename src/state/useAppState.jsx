import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'tracker90:v1'
const PHASES = [
  { name: 'Foundation', min: 1, max: 30 },
  { name: 'Momentum', min: 31, max: 60 },
  { name: 'Compound', min: 61, max: 90 },
]

const AppStateContext = createContext(null)

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

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
  if (!startDate || !checklist.length) {
    return { currentStreak: 0, longestStreak: 0 }
  }

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
    const completed =
      !!log && allIds.length > 0 && allIds.every((id) => !!log.checks?.[id])

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
    const completed =
      !!log && allIds.length > 0 && allIds.every((id) => !!log.checks?.[id])

    if (!completed) {
      break
    }
    current += 1
  }

  return { currentStreak: current, longestStreak: longest }
}

const loadInitialState = () => {
  const today = getLocalDateString()
  const base = {
    profile: {
      name: '',
      startDate: '',
      endDate: '',
    },
    goal: {
      statement: '',
      history: [],
    },
    checklist: [],
    dailyLogs: {},
    weeklyReviews: [],
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!parsed) {
      return base
    }

    return {
      ...base,
      ...parsed,
      profile: { ...base.profile, ...parsed.profile },
      goal: {
        ...base.goal,
        ...parsed.goal,
        history: Array.isArray(parsed.goal?.history) ? parsed.goal.history : [],
      },
      checklist: Array.isArray(parsed.checklist) ? parsed.checklist : [],
      dailyLogs: parsed.dailyLogs && typeof parsed.dailyLogs === 'object' ? parsed.dailyLogs : {},
      weeklyReviews: Array.isArray(parsed.weeklyReviews) ? parsed.weeklyReviews : [],
      _meta: { today },
    }
  } catch {
    return base
  }
}

export function AppStateProvider({ children }) {
  const [state, setState] = useState(loadInitialState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const today = getLocalDateString()
  const dayNumber = state.profile.startDate
    ? diffDaysInclusive(state.profile.startDate, today)
    : 0
  const boundedDay = Math.max(0, Math.min(dayNumber, 90))
  const phase = PHASES.find((item) => boundedDay >= item.min && boundedDay <= item.max)?.name || 'Setup'

  const todayLog = state.dailyLogs[today] || { checks: {}, note: '' }
  const allDoneToday =
    state.checklist.length > 0 &&
    state.checklist.every((item) => !!todayLog.checks?.[item.id])

  const streaks = calculateStreaks(
    state.dailyLogs,
    state.checklist,
    state.profile.startDate,
    state.profile.endDate,
    today,
  )

  const isOnboarded =
    !!state.profile.name &&
    !!state.profile.startDate &&
    !!state.goal.statement &&
    state.checklist.length >= 3

  const currentWeek = boundedDay > 0 ? Math.ceil(boundedDay / 7) : 0
  const hasCurrentWeekReview = state.weeklyReviews.some((item) => item.weekNumber === currentWeek)
  const isWeeklyReviewDue = currentWeek > 0 && !hasCurrentWeekReview

  const completeOnboarding = useCallback(({ name, startDate, goalStatement, checklistTexts }) => {
    const normalizedChecklist = checklistTexts
      .map((text) => text.trim())
      .filter(Boolean)
      .slice(0, 5)
      .map((text) => ({ id: createId(), text }))

    const endDate = addDays(startDate, 89)
    const statement = goalStatement.trim()

    setState((prev) => ({
      ...prev,
      profile: {
        name: name.trim(),
        startDate,
        endDate,
      },
      goal: {
        statement,
        history: statement
          ? [{ statement, editedAt: new Date().toISOString() }]
          : prev.goal.history,
      },
      checklist: normalizedChecklist,
    }))
  }, [])

  const toggleTodayChecklist = useCallback(
    (itemId) => {
      setState((prev) => {
        const log = prev.dailyLogs[today] || { checks: {}, note: '' }

        return {
          ...prev,
          dailyLogs: {
            ...prev.dailyLogs,
            [today]: {
              ...log,
              checks: {
                ...log.checks,
                [itemId]: !log.checks?.[itemId],
              },
            },
          },
        }
      })
    },
    [today],
  )

  const updateTodayNote = useCallback(
    (note) => {
      setState((prev) => {
        const log = prev.dailyLogs[today] || { checks: {}, note: '' }

        return {
          ...prev,
          dailyLogs: {
            ...prev.dailyLogs,
            [today]: {
              ...log,
              note,
            },
          },
        }
      })
    },
    [today],
  )

  const saveWeeklyReview = useCallback(
    (answers) => {
      if (!currentWeek) {
        return
      }

      setState((prev) => {
        const existing = prev.weeklyReviews.filter((item) => item.weekNumber !== currentWeek)
        return {
          ...prev,
          weeklyReviews: [
            ...existing,
            {
              id: createId(),
              weekNumber: currentWeek,
              date: today,
              answers,
            },
          ].sort((a, b) => a.weekNumber - b.weekNumber),
        }
      })
    },
    [currentWeek, today],
  )

  const updateGoal = useCallback((statement) => {
    const clean = statement.trim()
    if (!clean) {
      return
    }

    setState((prev) => ({
      ...prev,
      goal: {
        statement: clean,
        history: [
          ...prev.goal.history,
          {
            statement: clean,
            editedAt: new Date().toISOString(),
          },
        ],
      },
    }))
  }, [])

  const updateProfile = useCallback(({ name, startDate }) => {
    const endDate = addDays(startDate, 89)

    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        name: name.trim(),
        startDate,
        endDate,
      },
    }))
  }, [])

  const updateChecklist = useCallback((items) => {
    const normalized = items
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5)
      .map((text, index) => ({
        id: state.checklist[index]?.text === text ? state.checklist[index].id : createId(),
        text,
      }))

    setState((prev) => ({
      ...prev,
      checklist: normalized,
    }))
  }, [state.checklist])

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `90-day-tracker-export-${today}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [state, today])

  const value = useMemo(
    () => ({
      state,
      today,
      dayNumber: boundedDay,
      phase,
      todayLog,
      allDoneToday,
      streaks,
      currentWeek,
      isWeeklyReviewDue,
      isOnboarded,
      completeOnboarding,
      toggleTodayChecklist,
      updateTodayNote,
      saveWeeklyReview,
      updateGoal,
      updateProfile,
      updateChecklist,
      exportData,
    }),
    [
      state,
      today,
      boundedDay,
      phase,
      todayLog,
      allDoneToday,
      streaks,
      currentWeek,
      isWeeklyReviewDue,
      isOnboarded,
      completeOnboarding,
      toggleTodayChecklist,
      updateTodayNote,
      saveWeeklyReview,
      updateGoal,
      updateProfile,
      updateChecklist,
      exportData,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider')
  }
  return context
}
