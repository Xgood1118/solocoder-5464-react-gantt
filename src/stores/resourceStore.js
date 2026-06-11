import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS, RESOURCE_TYPE } from '../constants'
import { generateResourceId } from '../utils/idUtils'

export const useResourceStore = create(
  persist(
    (set, get) => ({
      resources: [],

      getProjectResources: (projectId) => {
        return get().resources.filter((r) => r.projectId === projectId)
      },

      addResource: (data) => {
        const resource = {
          id: generateResourceId(),
          projectId: data.projectId,
          name: data.name || '新资源',
          type: data.type || RESOURCE_TYPE.PERSON,
          dailyCapacity: data.dailyCapacity || 8,
          color: data.color || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
          email: data.email || '',
          createdAt: new Date().toISOString()
        }
        set({ resources: [...get().resources, resource] })
        return resource
      },

      updateResource: (id, data) => {
        set({
          resources: get().resources.map((r) => (r.id === id ? { ...r, ...data } : r))
        })
      },

      deleteResource: (id) => {
        set({ resources: get().resources.filter((r) => r.id !== id) })
      },

      importResources: (resources) => set({ resources })
    }),
    {
      name: STORAGE_KEYS.RESOURCES,
      partialize: (state) => ({ resources: state.resources })
    }
  )
)
