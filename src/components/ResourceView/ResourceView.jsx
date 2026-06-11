import { useMemo } from 'react'
import { useTimeline } from '../../hooks/useTimeline'
import { DAY_WIDTH, ROW_HEIGHT } from '../../constants'
import { dayjs, isWeekend, formatDate } from '../../utils/dateUtils'

export default function ResourceView({
  projectId,
  tasks,
  resources,
  resourceAssignments,
  resourceLoad,
  settings
}) {
  const allTasksForTimeline = useMemo(() => {
    const result = []
    resourceAssignments.forEach((a) => {
      const t = tasks.find((x) => x.id === a.taskId)
      if (t) result.push(t)
    })
    return result.length > 0 ? result : tasks
  }, [resourceAssignments, tasks])

  const timeline = useTimeline(allTasksForTimeline)

  const resourceTaskMap = useMemo(() => {
    const map = new Map()
    resources.forEach((r) => map.set(r.id, []))
    resourceAssignments.forEach((a) => {
      const t = tasks.find((x) => x.id === a.taskId)
      if (t && map.has(a.resourceId)) {
        map.get(a.resourceId).push({ task: t, units: a.units })
      }
    })
    return map
  }, [resources, resourceAssignments, tasks])

  if (!projectId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
        请先选择一个项目
      </div>
    )
  }

  if (resources.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>👥</div>
        <div>暂无资源，请先在资源面板添加</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      <div style={{
        width: 200,
        borderRight: '1px solid #e5e7eb',
        background: '#fff',
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '10px 12px',
          fontWeight: 600,
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
          height: 60,
          display: 'flex',
          alignItems: 'center'
        }}>
          资源甘特
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {resources.map((r) => (
            <div
              key={r.id}
              style={{
                height: ROW_HEIGHT,
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: 8
              }}
            >
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: r.color,
                flexShrink: 0
              }} />
              <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.name}
              </span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                {r.dailyCapacity}h/天
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          flexShrink: 0,
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: timeline.totalWidth }}>
            <div style={{ display: 'flex', height: 30, borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
              {(() => {
                const groups = []
                let cur = null
                let count = 0
                timeline.days.forEach((d) => {
                  const key = d.format('YYYY-MM')
                  if (key !== cur) {
                    if (cur) groups.push({ key: cur, count })
                    cur = key
                    count = 1
                  } else count++
                })
                if (cur) groups.push({ key: cur, count })
                return groups.map((g) => (
                  <div
                    key={g.key}
                    style={{
                      width: g.count * DAY_WIDTH,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      borderRight: '1px solid #e5e7eb'
                    }}
                  >
                    {dayjs(g.key + '-01').format('YYYY年 M月')}
                  </div>
                ))
              })()}
            </div>
            <div style={{ display: 'flex', height: 30, background: '#fff' }}>
              {timeline.days.map((d, idx) => {
                const weekend = isWeekend(d)
                return (
                  <div
                    key={idx}
                    style={{
                      width: DAY_WIDTH,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      color: weekend ? '#ef4444' : '#6b7280',
                      background: weekend ? '#f9fafb' : '#fff',
                      borderRight: '1px solid #f3f4f6'
                    }}
                  >
                    {d.format('D')}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ position: 'relative', width: timeline.totalWidth }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', pointerEvents: 'none' }}>
              {timeline.days.map((d, idx) => {
                const weekend = isWeekend(d)
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: idx * DAY_WIDTH,
                      width: DAY_WIDTH,
                      background: weekend ? '#fafafa' : 'transparent',
                      borderRight: '1px solid #f3f4f6'
                    }}
                  />
                )
              })}
            </div>

            {resources.map((r, rIdx) => {
              const loadMap = resourceLoad?.get(r.id) || {}
              const assignments = resourceTaskMap.get(r.id) || []

              return (
                <div
                  key={r.id}
                  style={{
                    height: ROW_HEIGHT,
                    borderBottom: '1px solid #f3f4f6',
                    position: 'relative',
                    top: rIdx * ROW_HEIGHT
                  }}
                >
                  {timeline.days.map((d, idx) => {
                    const dateStr = d.format('YYYY-MM-DD')
                    const loadInfo = loadMap[dateStr]
                    if (!loadInfo) return null
                    let bg = 'transparent'
                    if (loadInfo.overloaded) bg = 'rgba(245, 158, 11, 0.3)'
                    else if (loadInfo.loadPercent > 80) bg = 'rgba(245, 158, 11, 0.15)'
                    if (bg === 'transparent') return null
                    return (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          left: idx * DAY_WIDTH,
                          width: DAY_WIDTH,
                          background: bg,
                          borderRight: '1px solid #f3f4f6',
                          fontSize: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: loadInfo.overloaded ? '#92400e' : '#92400e'
                        }}
                        title={`${dateStr}: ${loadInfo.hours.toFixed(1)}h / ${loadInfo.capacity}h (${loadInfo.loadPercent}%)`}
                      >
                        {loadInfo.loadPercent >= 50 ? loadInfo.loadPercent + '%' : ''}
                      </div>
                    )
                  })}

                  {assignments.map(({ task, units }, aIdx) => {
                    const left = timeline.getDayOffset(task.startDate)
                    const days = dayjs(task.endDate).diff(dayjs(task.startDate), 'day') + 1
                    const width = Math.max(days * DAY_WIDTH, 4)
                    return (
                      <div
                        key={aIdx}
                        style={{
                          position: 'absolute',
                          left,
                          top: 8,
                          height: 24,
                          width,
                          background: r.color,
                          borderRadius: 4,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 6px',
                          fontSize: 11,
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textShadow: '0 1px 1px rgba(0,0,0,0.3)',
                          zIndex: 10
                        }}
                        title={`${task.name} - ${formatDate(task.startDate)} ~ ${formatDate(task.endDate)} (${units}%)`}
                      >
                        {width > 60 ? task.name : ''}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
