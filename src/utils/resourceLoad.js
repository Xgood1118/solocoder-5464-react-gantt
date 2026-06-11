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
    const hoursPerDay = (a.units || 100) / 100 * (task.hoursPerDay || settings.workingHoursPerDay)

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
    Object.keys(dayMap).forEach((day) => {
      const hours = dayMap[day]
      const capacity = r.dailyCapacity || settings.workingHoursPerDay
      normalized[day] = {
        hours,
        capacity,
        loadPercent: Math.round((hours / capacity) * 100),
        overloaded: hours > capacity
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
