import { useRef, useState, useEffect } from 'react'
import {
  DAY_WIDTH,
  TASK_TYPE,
  TASK_STATUS_COLOR,
  TASK_STATUS,
  TASK_PRIORITY
} from '../../constants'
import { dayjs, isWeekend } from '../../utils/dateUtils'
import './GanttBar.css'

export default function GanttBar({
  task,
  left,
  width,
  rowHeight,
  isCritical,
  isSelected,
  criticalPathColor,
  onDragStart,
  onDragEnd,
  onClick,
  onDoubleClick,
  getDayOffset,
  startDate
}) {
  const barRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const statusColor = TASK_STATUS_COLOR[task.status] || '#6b7280'
  const bgColor = isSelected ? statusColor : statusColor

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    e.stopPropagation()
    onClick?.(task.id)

    const startX = e.clientX
    const originalStart = dayjs(task.startDate)
    const originalEnd = dayjs(task.endDate)
    const mode = 'move'

    setDragging(true)
    onDragStart?.(task.id)

    const handleMove = (ev) => {
      const dx = ev.clientX - startX
      const days = Math.round(dx / DAY_WIDTH)
      if (days === 0) return

      let newStart = originalStart.add(days, 'day')
      let newEnd = originalEnd.add(days, 'day')

      if (task.type === TASK_TYPE.MILESTONE) {
        newEnd = newStart
      }

      onDragEnd?.(task.id, {
        startDate: newStart.format('YYYY-MM-DD'),
        endDate: newEnd.format('YYYY-MM-DD')
      })
    }

    const handleUp = () => {
      setDragging(false)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  const handleResizeStart = (e, side) => {
    if (e.button !== 0) return
    e.stopPropagation()

    const startX = e.clientX
    const originalStart = dayjs(task.startDate)
    const originalEnd = dayjs(task.endDate)

    setDragging(true)
    onDragStart?.(task.id)

    const handleMove = (ev) => {
      const dx = ev.clientX - startX
      const days = Math.round(dx / DAY_WIDTH)
      if (days === 0) return

      let newStart = originalStart
      let newEnd = originalEnd

      if (side === 'left') {
        newStart = originalStart.add(days, 'day')
        if (newStart.isAfter(newEnd)) newStart = newEnd
      } else {
        newEnd = originalEnd.add(days, 'day')
        if (newEnd.isBefore(newStart)) newEnd = newStart
      }

      onDragEnd?.(task.id, {
        startDate: newStart.format('YYYY-MM-DD'),
        endDate: newEnd.format('YYYY-MM-DD')
      })
    }

    const handleUp = () => {
      setDragging(false)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  if (task.type === TASK_TYPE.MILESTONE) {
    return (
      <div
        className={`milestone-marker ${isCritical ? 'critical' : ''}`}
        style={{
          left: left + DAY_WIDTH / 2 - 10,
          background: isCritical ? criticalPathColor : '#7c3aed'
        }}
        onMouseDown={handleMouseDown}
        onClick={() => onClick?.(task.id)}
        onDoubleClick={() => onDoubleClick?.(task)}
        title={`${task.name} - ${dayjs(task.startDate).format('YYYY-MM-DD')}`}
      />
    )
  }

  const progressWidth = (task.progress / 100) * width

  return (
    <div
      ref={barRef}
      className={`gantt-bar ${isCritical ? 'critical' : ''} ${dragging ? 'dragging' : ''}`}
      style={{
        left,
        width: Math.max(width, 4),
        background: isCritical ? criticalPathColor : bgColor,
        borderColor: isSelected ? '#1d4ed8' : undefined
      }}
      onMouseDown={handleMouseDown}
      onClick={() => onClick?.(task.id)}
      onDoubleClick={() => onDoubleClick?.(task)}
    >
      {task.progress > 0 && (
        <div
          className="gantt-bar-progress"
          style={{
            width: progressWidth,
            background: 'rgba(0,0,0,0.25)'
          }}
        />
      )}
      {width > 40 && (
        <span className="gantt-bar-label">
          {task.name} {task.progress > 0 ? `(${task.progress}%)` : ''}
        </span>
      )}
      <div
        className="gantt-bar-resize left"
        onMouseDown={(e) => handleResizeStart(e, 'left')}
      />
      <div
        className="gantt-bar-resize right"
        onMouseDown={(e) => handleResizeStart(e, 'right')}
      />
    </div>
  )
}
