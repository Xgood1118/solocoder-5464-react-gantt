import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '../constants'
import { generateBaselineId } from '../utils/idUtils'

export const useBaselineStore = create(
  persist(
    (set, get) => ({
      baselines: [],

      getProjectBaselines: (projectId) => {
        return get().baselines.filter((b) => b.projectId === projectId)
      },

      createBaseline: (data) => {
        const baseline = {
          id: generateBaselineId(),
          projectId: data.projectId,
          name: data.name || `基线 ${new Date().toLocaleString()}`,
          description: data.description || '',
          tasksSnapshot: data.tasksSnapshot || [],
          linksSnapshot: data.linksSnapshot || [],
          createdAt: new Date().toISOString()
        }
        set({ baselines: [...get().baselines, baseline] })
        return baseline
      },

      deleteBaseline: (id) => {
        set({ baselines: get().baselines.filter((b) => b.id !== id) })
      },

      importBaselines: (baselines) => set({ baselines })
    }),
    {
      name: STORAGE_KEYS.BASELINES,
      partialize: (state) => ({ baselines: state.baselines })
    }
  )
)
