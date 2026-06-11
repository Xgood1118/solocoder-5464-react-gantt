import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS, DEPENDENCY_TYPE } from '../constants'
import { generateLinkId } from '../utils/idUtils'
import { detectCycle } from '../utils/topology'

export const useLinkStore = create(
  persist(
    (set, get) => ({
      links: [],

      getProjectLinks: (projectId) => {
        return get().links.filter((l) => l.projectId === projectId)
      },

      addLink: (data, tasks) => {
        const projectTasks = tasks || []
        if (data.source === data.target) {
          return { success: false, error: '不能依赖自己' }
        }

        const existing = get().links.find(
          (l) => l.projectId === data.projectId && l.source === data.source && l.target === data.target
        )
        if (existing) {
          return { success: false, error: '依赖关系已存在' }
        }

        const testLinks = [
          ...get().links,
          {
            id: 'temp',
            projectId: data.projectId,
            source: data.source,
            target: data.target,
            type: data.type || DEPENDENCY_TYPE.FS
          }
        ]

        const { hasCycle } = detectCycle(projectTasks, testLinks)
        if (hasCycle) {
          return { success: false, error: '形成循环依赖，无法保存' }
        }

        const link = {
          id: generateLinkId(),
          projectId: data.projectId,
          source: data.source,
          target: data.target,
          type: data.type || DEPENDENCY_TYPE.FS,
          createdAt: new Date().toISOString()
        }
        set({ links: [...get().links, link] })
        return { success: true, link }
      },

      updateLink: (id, data) => {
        set({
          links: get().links.map((l) => (l.id === id ? { ...l, ...data } : l))
        })
      },

      deleteLink: (id) => {
        set({ links: get().links.filter((l) => l.id !== id) })
      },

      deleteLinksForTasks: (taskIds) => {
        const idSet = new Set(taskIds)
        set({
          links: get().links.filter((l) => !idSet.has(l.source) && !idSet.has(l.target))
        })
      },

      validateLinks: (tasks) => {
        return detectCycle(tasks, get().links)
      },

      importLinks: (links) => set({ links })
    }),
    {
      name: STORAGE_KEYS.LINKS,
      partialize: (state) => ({ links: state.links })
    }
  )
)
