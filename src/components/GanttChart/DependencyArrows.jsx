import { DAY_WIDTH, ROW_HEIGHT, DEPENDENCY_TYPE, TASK_TYPE } from '../../constants'
import { dayjs } from '../../utils/dateUtils'

export default function DependencyArrows({
  links,
  tasks,
  getDayOffset,
  rowHeight = ROW_HEIGHT,
  dayWidth = DAY_WIDTH
}) {
  const taskMap = new Map(tasks.map((t) => [t.id, t]))
  const rowIndexMap = new Map(tasks.map((t, i) => [t.id, i]))

  const arrows = links.map((link) => {
    const source = taskMap.get(link.source)
    const target = taskMap.get(link.target)
    if (!source || !target) return null

    const sourceRow = rowIndexMap.get(source.id)
    const targetRow = rowIndexMap.get(target.id)
    if (sourceRow === undefined || targetRow === undefined) return null

    let x1, x2
    const y1 = sourceRow * rowHeight + rowHeight / 2
    const y2 = targetRow * rowHeight + rowHeight / 2

    const isSourceMilestone = source.type === TASK_TYPE.MILESTONE
    const isTargetMilestone = target.type === TASK_TYPE.MILESTONE

    switch (link.type) {
      case DEPENDENCY_TYPE.FS:
        x1 = getDayOffset(source.endDate) + dayWidth
        x2 = getDayOffset(target.startDate)
        break
      case DEPENDENCY_TYPE.SS:
        x1 = getDayOffset(source.startDate)
        x2 = getDayOffset(target.startDate)
        break
      case DEPENDENCY_TYPE.FF:
        x1 = getDayOffset(source.endDate) + dayWidth
        x2 = getDayOffset(target.endDate) + dayWidth
        break
      case DEPENDENCY_TYPE.SF:
        x1 = getDayOffset(source.startDate)
        x2 = getDayOffset(target.endDate) + dayWidth
        break
      default:
        x1 = getDayOffset(source.endDate) + dayWidth
        x2 = getDayOffset(target.startDate)
    }

    const midY = y1 < y2 ? y2 - 8 : y2 + 8
    const path = `M ${x1} ${y1} L ${x1 + 8} ${y1} L ${x1 + 8} ${midY} L ${x2 - 8} ${midY} L ${x2 - 8} ${y2} L ${x2} ${y2}`

    const colors = {
      [DEPENDENCY_TYPE.FS]: '#3b82f6',
      [DEPENDENCY_TYPE.SS]: '#10b981',
      [DEPENDENCY_TYPE.FF]: '#f59e0b',
      [DEPENDENCY_TYPE.SF]: '#ef4444'
    }

    return (
      <path
        key={link.id}
        d={path}
        fill="none"
        stroke={colors[link.type] || '#9ca3af'}
        strokeWidth="1.5"
        markerEnd="url(#arrowhead)"
        opacity="0.8"
      />
    )
  }).filter(Boolean)

  return (
    <svg
      className="dependency-arrow"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
        </marker>
      </defs>
      {arrows}
    </svg>
  )
}
