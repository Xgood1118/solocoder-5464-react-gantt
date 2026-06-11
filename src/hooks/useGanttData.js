import { useEffect, useMemo } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { useTaskStore } from '../stores/taskStore'
import { useLinkStore } from '../stores/linkStore'
import { useResourceStore } from '../stores/resourceStore'
import { useSettingsStore } from '../stores/settingsStore'
import { calculateCriticalPath } from '../utils/criticalPath'
import { calculateResourceLoad } from '../utils/resourceLoad'

export const useGanttData = (projectId) => {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId))
  const allTasks = useTaskStore((s) => s.tasks)
  const allLinks = useLinkStore((s) => s.links)
  const allResources = useResourceStore((s) => s.resources)
  const resourceAssignments = useTaskStore((s) => s.resourceAssignments)
  const collapsed = useTaskStore((s) => s.collapsed)
  const settings = useSettingsStore()

  const tasks = useMemo(
    () => allTasks.filter((t) => t.projectId === projectId),
    [allTasks, projectId]
  )
  const links = useMemo(
    () => allLinks.filter((l) => l.projectId === projectId),
    [allLinks, projectId]
  )
  const resources = useMemo(
    () => allResources.filter((r) => r.projectId === projectId),
    [allResources, projectId]
  )

  const criticalData = useMemo(() => {
    if (tasks.length === 0) return { earliest: new Map(), latest: new Map(), criticalTasks: new Set() }
    return calculateCriticalPath(tasks, links, project?.endDate, settings)
  }, [tasks, links, project, settings])

  const resourceLoad = useMemo(() => {
    return calculateResourceLoad(tasks, resources, resourceAssignments, settings)
  }, [tasks, resources, resourceAssignments, settings])

  return {
    project,
    tasks,
    links,
    resources,
    resourceAssignments,
    collapsed,
    settings,
    ...criticalData,
    resourceLoad
  }
}
