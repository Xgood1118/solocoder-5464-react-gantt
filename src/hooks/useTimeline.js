import { useMemo } from 'react'
import { dayjs, getDaysRange } from '../utils/dateUtils'
import { DAY_WIDTH, HEADER_HEIGHT } from '../constants'

export const useTimeline = (tasks, zoom = 'day') => {
  return useMemo(() => {
    if (tasks.length === 0) {
      const today = dayjs()
      return {
        startDate: today.subtract(7, 'day'),
        endDate: today.add(30, 'day'),
        days: [],
        totalWidth: 37 * DAY_WIDTH,
        getDayOffset: () => 0
      }
    }

    let minDate = dayjs(tasks[0].startDate)
    let maxDate = dayjs(tasks[0].endDate)

    tasks.forEach((t) => {
      const s = dayjs(t.startDate)
      const e = dayjs(t.endDate)
      if (s.isBefore(minDate)) minDate = s
      if (e.isAfter(maxDate)) maxDate = e
    })

    const startDate = minDate.subtract(7, 'day').startOf('day')
    const endDate = maxDate.add(14, 'day').endOf('day')
    const days = getDaysRange(startDate, endDate)
    const totalWidth = days.length * DAY_WIDTH

    const getDayOffset = (date) => {
      const d = dayjs(date).startOf('day')
      const diff = d.diff(startDate, 'day')
      return Math.max(0, diff) * DAY_WIDTH
    }

    return { startDate, endDate, days, totalWidth, getDayOffset }
  }, [tasks, zoom])
}
