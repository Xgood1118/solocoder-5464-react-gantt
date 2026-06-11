import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS, TASK_TYPE, TASK_STATUS, TASK_PRIORITY } from '../constants'
import { generateTaskId } from '../utils/idUtils'
import { dayjs, calculateWorkingDays } from '../utils/dateUtils'

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      collapsed: {},
      resourceAssignments: [],

      toggleCollapse: (taskId) => {
        const collapsed = { ...get().collapsed }
        collapsed[taskId] = !collapsed[taskId]
        set({ collapsed })
      },

      setCollapsed: (taskId, value) => {
        const collapsed = { ...get().collapsed }
        collapsed[taskId] = value
        set({ collapsed })
      },

      getProjectTasks: (projectId) => {
        return get().tasks.filter((t) => t.projectId === projectId)
      },

      getTaskChildren: (taskId, projectId) => {
        return get().tasks
          .filter((t) => t.projectId === projectId && t.parentId === taskId)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      },

      getTaskTree: (projectId) => {
        const allTasks = get().getProjectTasks(projectId)
        const buildTree = (parentId = null) => {
          return allTasks
            .filter((t) => t.parentId === parentId)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((t) => ({
              ...t,
              children: buildTree(t.id)
            }))
        }
        return buildTree(null)
      },

      getDescendantIds: (taskId, projectId) => {
        const ids = []
        const collect = (parentId) => {
          const children = get().getTaskChildren(parentId, projectId)
          children.forEach((c) => {
            ids.push(c.id)
            collect(c.id)
          })
        }
        collect(taskId)
        return ids
      },

      addTask: (data) => {
        const isMilestone = data.type === TASK_TYPE.MILESTONE
        const start = dayjs(data.startDate || dayjs())
        const endDate = isMilestone ? start : (data.endDate ? dayjs(data.endDate) : start.add(3, 'day'))
        const duration = isMilestone ? 0 : calculateWorkingDays(start, endDate)

        const task = {
          id: generateTaskId(),
          projectId: data.projectId,
          parentId: data.parentId || null,
          name: data.name || '新任务',
          type: data.type || TASK_TYPE.TASK,
          startDate: start.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          duration,
          progress: data.progress ?? 0,
          priority: data.priority || TASK_PRIORITY.MEDIUM,
          status: data.status || TASK_STATUS.NOT_STARTED,
          assigneeId: data.assigneeId || null,
          description: data.description || '',
          sortOrder: data.sortOrder ?? Date.now(),
          hoursPerDay: data.hoursPerDay || 8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        const tasks = [...get().tasks, task]
        set({ tasks })

        if (data.resources && data.resources.length > 0) {
          const assignments = data.resources.map((r) => ({
            taskId: task.id,
            resourceId: r.resourceId,
            units: r.units || 100
          }))
          set({ resourceAssignments: [...get().resourceAssignments, ...assignments] })
        }

        return task
      },

      updateTask: (id, data) => {
        const tasks = get().tasks.map((t) => {
          if (t.id !== id) return t
          const updated = { ...t, ...data, updatedAt: new Date().toISOString() }
          if (data.startDate || data.endDate) {
            const start = dayjs(updated.startDate)
            const end = dayjs(updated.endDate)
            if (updated.type === TASK_TYPE.MILESTONE) {
              updated.duration = 0
              updated.endDate = updated.startDate
            } else {
              updated.duration = calculateWorkingDays(start, end)
            }
          }
          return updated
        })
        set({ tasks })

        if (data.resources) {
          const others = get().resourceAssignments.filter((a) => a.taskId !== id)
          const newAssignments = data.resources.map((r) => ({
            taskId: id,
            resourceId: r.resourceId,
            units: r.units || 100
          }))
          set({ resourceAssignments: [...others, ...newAssignments] })
        }
      },

      updateTasksBatch: (updates) => {
        const taskMap = new Map(get().tasks.map((t) => [t.id, t]))
        updates.forEach(({ id, data }) => {
          if (taskMap.has(id)) {
            const existing = taskMap.get(id)
            const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
            if (data.startDate || data.endDate) {
              const start = dayjs(updated.startDate)
              const end = dayjs(updated.endDate)
              if (updated.type === TASK_TYPE.MILESTONE) {
                updated.duration = 0
                updated.endDate = updated.startDate
              } else {
                updated.duration = calculateWorkingDays(start, end)
              }
            }
            taskMap.set(id, updated)
          }
        })
        set({ tasks: Array.from(taskMap.values()) })
      },

      deleteTask: (id) => {
        const projectId = get().tasks.find((t) => t.id === id)?.projectId
        const descendantIds = get().getDescendantIds(id, projectId)
        const toDelete = new Set([id, ...descendantIds])
        const tasks = get().tasks.filter((t) => !toDelete.has(t.id))
        const resourceAssignments = get().resourceAssignments.filter((a) => !toDelete.has(a.taskId))

        const collapsed = { ...get().collapsed }
        toDelete.forEach((tid) => delete collapsed[tid])

        set({ tasks, resourceAssignments, collapsed })
        return toDelete
      },

      getTaskResources: (taskId) => {
        return get().resourceAssignments.filter((a) => a.taskId === taskId)
      },

      importTasks: (tasks, resourceAssignments = [], collapsed = {}) => {
        set({ tasks, resourceAssignments, collapsed })
      }
    }),
    {
      name: STORAGE_KEYS.TASKS,
      partialize: (state) => ({
        tasks: state.tasks,
        collapsed: state.collapsed,
        resourceAssignments: state.resourceAssignments
      })
    }
  )
)
