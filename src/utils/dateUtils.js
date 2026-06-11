import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import { DEFAULT_SETTINGS } from '../constants'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(isoWeek)
dayjs.extend(duration)

export default dayjs
export { dayjs }

export const formatDate = (date, fmt = 'YYYY-MM-DD') => {
  if (!date) return ''
  return dayjs(date).format(fmt)
}

export const parseDate = (date) => dayjs(date)

export const isWeekend = (date) => {
  const d = dayjs(date)
  return d.day() === 0 || d.day() === 6
}

export const addWorkingDays = (startDate, days, excludeWeekends = DEFAULT_SETTINGS.excludeWeekends) => {
  let result = dayjs(startDate)
  let remaining = days
  let safety = 0
  while (remaining > 0 && safety < 1000) {
    result = result.add(1, 'day')
    if (!excludeWeekends || !isWeekend(result)) {
      remaining--
    }
    safety++
  }
  return result
}

export const calculateWorkingDays = (startDate, endDate, excludeWeekends = DEFAULT_SETTINGS.excludeWeekends) => {
  const start = dayjs(startDate).startOf('day')
  const end = dayjs(endDate).startOf('day')
  if (end.isBefore(start)) return 0
  let count = 0
  let current = start
  let safety = 0
  while (current.isSameOrBefore(end) && safety < 1000) {
    if (!excludeWeekends || !isWeekend(current)) {
      count++
    }
    current = current.add(1, 'day')
    safety++
  }
  return count
}

export const getWorkingDaysBetween = (startDate, endDate, excludeWeekends = DEFAULT_SETTINGS.excludeWeekends) => {
  const days = []
  const start = dayjs(startDate).startOf('day')
  const end = dayjs(endDate).startOf('day')
  let current = start
  let safety = 0
  while (current.isSameOrBefore(end) && safety < 1000) {
    if (!excludeWeekends || !isWeekend(current)) {
      days.push(current.format('YYYY-MM-DD'))
    }
    current = current.add(1, 'day')
    safety++
  }
  return days
}

export const getDaysRange = (startDate, endDate) => {
  const days = []
  const start = dayjs(startDate).startOf('day')
  const end = dayjs(endDate).startOf('day')
  let current = start
  let safety = 0
  while (current.isSameOrBefore(end) && safety < 2000) {
    days.push(current)
    current = current.add(1, 'day')
    safety++
  }
  return days
}
