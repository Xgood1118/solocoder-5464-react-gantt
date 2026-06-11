import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants'

export const useSettingsStore = create(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setExcludeWeekends: (v) => set({ excludeWeekends: v }),
      setBaselineDeviationDays: (v) => set({ baselineDeviationDays: v }),
      setCriticalPathColor: (v) => set({ criticalPathColor: v }),
      setWorkingHoursPerDay: (v) => set({ workingHoursPerDay: v }),
      resetSettings: () => set({ ...DEFAULT_SETTINGS })
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      partialize: (state) => ({
        excludeWeekends: state.excludeWeekends,
        baselineDeviationDays: state.baselineDeviationDays,
        criticalPathColor: state.criticalPathColor,
        workingHoursPerDay: state.workingHoursPerDay
      })
    }
  )
)
