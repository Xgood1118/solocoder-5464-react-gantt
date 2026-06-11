import { DAY_WIDTH, HEADER_HEIGHT, ROW_HEIGHT } from '../../constants'
import { dayjs, isWeekend } from '../../utils/dateUtils'

export default function GanttTimeline({ days, totalWidth, scrollLeft }) {
  const monthGroups = []
  let currentMonth = null
  let currentCount = 0

  days.forEach((d) => {
    const monthKey = d.format('YYYY-MM')
    if (monthKey !== currentMonth) {
      if (currentMonth) {
        monthGroups.push({ month: currentMonth, count: currentCount })
      }
      currentMonth = monthKey
      currentCount = 1
    } else {
      currentCount++
    }
  })
  if (currentMonth) {
    monthGroups.push({ month: currentMonth, count: currentCount })
  }

  const today = dayjs().format('YYYY-MM-DD')

  return (
    <div className="gantt-timeline" style={{ width: totalWidth }}>
      <div className="timeline-months" style={{ width: totalWidth }}>
        {monthGroups.map((mg, idx) => (
          <div
            key={idx}
            className="timeline-month"
            style={{ width: mg.count * DAY_WIDTH }}
          >
            {dayjs(mg.month + '-01').format('YYYY年 M月')}
          </div>
        ))}
      </div>
      <div className="timeline-days" style={{ width: totalWidth }}>
        {days.map((d, idx) => {
          const dateStr = d.format('YYYY-MM-DD')
          const weekend = isWeekend(d)
          const isToday = dateStr === today
          return (
            <div
              key={idx}
              className={`timeline-day ${weekend ? 'weekend' : ''} ${isToday ? 'today' : ''}`}
              style={{ width: DAY_WIDTH }}
              title={d.format('YYYY-MM-DD dddd')}
            >
              {d.format('D')}
            </div>
          )
        })}
      </div>
    </div>
  )
}
