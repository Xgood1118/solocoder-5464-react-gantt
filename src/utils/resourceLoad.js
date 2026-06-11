import { getWorkingDaysBetween, dayjs } from './dateUtils'
import { DEFAULT_SETTINGS } from '../constants'

export const calculateResourceLoad = (tasks, resources, assignments, settings = DEFAULT_SETTINGS) => {
  const loadMap = new Map()

  resources.forEach((r) => {
    loadMap.set(r.id, {})
  })

  assignments.forEach((a) => {
    const task = tasks.find((t) => t.id === a.taskId)
    if (!task) return
    const days = getWorkingDaysBetween(task.startDate, task.endDate, settings.excludeWeekends)
    const units = Math.max(0, Math.min(100, a.units ?? 100))
    const taskHoursPerDay = Math.max(0, task.hoursPerDay ?? settings.workingHoursPerDay)
    const hoursPerDay = (units / 100) * taskHoursPerDay

    days.forEach((day) => {
      if (!loadMap.has(a.resourceId)) loadMap.set(a.resourceId, {})
      const dayMap = loadMap.get(a.resourceId)
      dayMap[day] = (dayMap[day] || 0) + hoursPerDay
    })
  })

  const result = new Map()
  resources.forEach((r) => {
    const dayMap = loadMap.get(r.id) || {}
    const normalized = {}
    const capacity = Math.max(0.1, r.dailyCapacity ?? settings.workingHoursPerDay ?? 8)

    Object.keys(dayMap).forEach((day) => {
      const hours = dayMap[day] ?? 0
      const loadPercent = Math.round((hours / capacity) * 100)
      const isNaN = !isFinite(loadPercent)

      normalized[day] = {
        hours: isNaN ? 0 : hours,
        capacity,
        loadPercent: isNaN ? 0 : Math.max(0, Math.min(1000, loadPercent)),
        overloaded: !isNaN && hours > capacity,
        error: isNaN
      }
    })
    result.set(r.id, normalized)
  })

  return result
}

export const getOverloadedResources = (loadMap, date) => {
  const dateStr = dayjs(date).format('YYYY-MM-DD')
  const overloaded = []
  loadMap.forEach((dayMap, resourceId) => {
    if (dayMap[dateStr]?.overloaded) {
      overloaded.push(resourceId)
    }
  })
  return overloaded
}
