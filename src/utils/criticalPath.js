import dayjs from './dateUtils'
import { topologicalSort } from './topology'
import { DEPENDENCY_TYPE, TASK_TYPE, DEFAULT_SETTINGS } from '../constants'
import { addWorkingDays, calculateWorkingDays } from './dateUtils'

export const calculateCriticalPath = (tasks, links, projectEndDate, settings = DEFAULT_SETTINGS) => {
  const taskMap = new Map(tasks.map((t) => [t.id, { ...t }]))
  const sorted = topologicalSort(tasks, links)
  const sortedIds = sorted.map((t) => t.id)
  const reverseSortedIds = [...sortedIds].reverse()

  const incomingLinks = new Map()
  const outgoingLinks = new Map()
  tasks.forEach((t) => {
    incomingLinks.set(t.id, [])
    outgoingLinks.set(t.id, [])
  })
  links.forEach((l) => {
    if (incomingLinks.has(l.target)) incomingLinks.get(l.target).push(l)
    if (outgoingLinks.has(l.source)) outgoingLinks.get(l.source).push(l)
  })

  const earliest = new Map()
  sortedIds.forEach((id) => {
    const task = taskMap.get(id)
    const isMilestone = task.type === TASK_TYPE.MILESTONE

    let es = dayjs(task.startDate)
    const ins = incomingLinks.get(id) || []

    if (ins.length > 0) {
      ins.forEach((link) => {
        const source = taskMap.get(link.source)
        if (!source) return
        const sourceEs = earliest.get(link.source)?.start || dayjs(source.startDate)
        const sourceEf = earliest.get(link.source)?.end || dayjs(source.endDate)

        switch (link.type) {
          case DEPENDENCY_TYPE.FS: {
            const candidate = addWorkingDays(sourceEf, 1, settings.excludeWeekends)
            if (candidate.isAfter(es)) es = candidate
            break
          }
          case DEPENDENCY_TYPE.SS: {
            if (sourceEs.isAfter(es)) es = sourceEs
            break
          }
          case DEPENDENCY_TYPE.FF: {
            const taskDuration = isMilestone ? 0 : calculateWorkingDays(task.startDate, task.endDate, settings.excludeWeekends) - 1
            const candidateEf = sourceEf
            const candidateEs = addWorkingDays(candidateEf, -taskDuration, settings.excludeWeekends)
            if (candidateEs.isAfter(es)) es = candidateEs
            break
          }
          case DEPENDENCY_TYPE.SF: {
            const taskDuration = isMilestone ? 0 : calculateWorkingDays(task.startDate, task.endDate, settings.excludeWeekends) - 1
            const candidateEf = addWorkingDays(sourceEs, taskDuration, settings.excludeWeekends)
            const candidateEs = addWorkingDays(candidateEf, -taskDuration, settings.excludeWeekends)
            if (candidateEs.isAfter(es)) es = candidateEs
            break
          }
        }
      })
    }

    let ef
    if (isMilestone) {
      ef = es
    } else {
      const duration = calculateWorkingDays(task.startDate, task.endDate, settings.excludeWeekends)
      ef = duration > 0 ? addWorkingDays(es, duration - 1, settings.excludeWeekends) : es
    }

    earliest.set(id, { start: es, end: ef })
  })

  const latest = new Map()
  const endMilestones = tasks.filter(
    (t) => t.type === TASK_TYPE.MILESTONE && (outgoingLinks.get(t.id) || []).length === 0
  )
  const projectEnd = projectEndDate
    ? dayjs(projectEndDate)
    : (() => {
        const ends = Array.from(earliest.values()).map((v) => v.end)
        if (ends.length === 0) return dayjs()
        return ends.reduce((a, b) => (a.isAfter(b) ? a : b))
      })()

  reverseSortedIds.forEach((id) => {
    const task = taskMap.get(id)
    const isMilestone = task.type === TASK_TYPE.MILESTONE
    const outs = outgoingLinks.get(id) || []

    let lf = dayjs(projectEnd)
    if (outs.length > 0) {
      outs.forEach((link) => {
        const target = taskMap.get(link.target)
        if (!target) return
        const targetLs = latest.get(link.target)?.start || earliest.get(link.target)?.start || dayjs(target.startDate)
        const targetLf = latest.get(link.target)?.end || earliest.get(link.target)?.end || dayjs(target.endDate)

        switch (link.type) {
          case DEPENDENCY_TYPE.FS: {
            const candidate = addWorkingDays(targetLs, -1, settings.excludeWeekends)
            if (candidate.isBefore(lf)) lf = candidate
            break
          }
          case DEPENDENCY_TYPE.SS: {
            if (targetLs.isBefore(lf)) lf = targetLs
            break
          }
          case DEPENDENCY_TYPE.FF: {
            if (targetLf.isBefore(lf)) lf = targetLf
            break
          }
          case DEPENDENCY_TYPE.SF: {
            const sourceDuration = isMilestone ? 0 : calculateWorkingDays(task.startDate, task.endDate, settings.excludeWeekends) - 1
            const candidate = addWorkingDays(targetLf, -sourceDuration, settings.excludeWeekends)
            if (candidate.isBefore(lf)) lf = candidate
            break
          }
        }
      })
    } else if (!isMilestone && endMilestones.length === 0) {
      lf = earliest.get(id)?.end || dayjs(task.endDate)
    }

    let ls
    if (isMilestone) {
      ls = lf
    } else {
      const duration = calculateWorkingDays(task.startDate, task.endDate, settings.excludeWeekends)
      ls = duration > 0 ? addWorkingDays(lf, -(duration - 1), settings.excludeWeekends) : lf
    }

    latest.set(id, { start: ls, end: lf })
  })

  const criticalTasks = new Set()
  tasks.forEach((t) => {
    const e = earliest.get(t.id)
    const l = latest.get(t.id)
    if (e && l) {
      const float = Math.abs(e.start.diff(l.start, 'day'))
      if (float === 0) criticalTasks.add(t.id)
    }
  })

  return { earliest, latest, criticalTasks }
}

export const propagateDateChanges = (modifiedTaskId, tasks, links, settings = DEFAULT_SETTINGS) => {
  const taskMap = new Map(tasks.map((t) => [t.id, { ...t }]))
  const sorted = topologicalSort(tasks, links)
  const modifiedIndex = sorted.findIndex((t) => t.id === modifiedTaskId)
  const downstreamTasks = sorted.slice(modifiedIndex + 1)

  const outgoingLinks = new Map()
  tasks.forEach((t) => outgoingLinks.set(t.id, []))
  links.forEach((l) => {
    if (outgoingLinks.has(l.source)) outgoingLinks.get(l.source).push(l)
  })

  const changed = new Map()
  changed.set(modifiedTaskId, taskMap.get(modifiedTaskId))

  downstreamTasks.forEach((task) => {
    const ins = links.filter((l) => l.target === task.id)
    if (ins.length === 0) return

    let newStart = dayjs(task.startDate)
    let startChanged = false

    ins.forEach((link) => {
      const sourceTask = changed.get(link.source) || taskMap.get(link.source)
      if (!sourceTask) return

      const sourceStart = dayjs(sourceTask.startDate)
      const sourceEnd = dayjs(sourceTask.endDate)

      switch (link.type) {
        case DEPENDENCY_TYPE.FS: {
          const candidate = addWorkingDays(sourceEnd, 1, settings.excludeWeekends)
          if (candidate.isAfter(newStart)) {
            newStart = candidate
            startChanged = true
          }
          break
        }
        case DEPENDENCY_TYPE.SS: {
          if (sourceStart.isAfter(newStart)) {
            newStart = sourceStart
            startChanged = true
          }
          break
        }
        case DEPENDENCY_TYPE.FF:
        case DEPENDENCY_TYPE.SF: {
          break
        }
      }
    })

    if (startChanged && task.type !== TASK_TYPE.MILESTONE) {
      const duration = calculateWorkingDays(task.startDate, task.endDate, settings.excludeWeekends)
      const newEnd = duration > 0 ? addWorkingDays(newStart, duration - 1, settings.excludeWeekends) : newStart
      const updated = {
        ...task,
        startDate: newStart.format('YYYY-MM-DD'),
        endDate: newEnd.format('YYYY-MM-DD')
      }
      changed.set(task.id, updated)
      taskMap.set(task.id, updated)
    } else if (startChanged && task.type === TASK_TYPE.MILESTONE) {
      const updated = {
        ...task,
        startDate: newStart.format('YYYY-MM-DD'),
        endDate: newStart.format('YYYY-MM-DD')
      }
      changed.set(task.id, updated)
      taskMap.set(task.id, updated)
    }
  })

  return changed
}
