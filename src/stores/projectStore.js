import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '../constants'
import { generateProjectId } from '../utils/idUtils'

export const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      setActiveProject: (id) => set({ activeProjectId: id }),

      getActiveProject: () => {
        const { projects, activeProjectId } = get()
        return projects.find((p) => p.id === activeProjectId) || null
      },

      addProject: (data) => {
        const project = {
          id: generateProjectId(),
          name: data.name || '新项目',
          description: data.description || '',
          startDate: data.startDate,
          endDate: data.endDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        const projects = [...get().projects, project]
        set({ projects, activeProjectId: project.id })
        return project
      },

      updateProject: (id, data) => {
        set({
          projects: get().projects.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          )
        })
      },

      deleteProject: (id) => {
        const projects = get().projects.filter((p) => p.id !== id)
        const activeProjectId = get().activeProjectId === id
          ? (projects[0]?.id || null)
          : get().activeProjectId
        set({ projects, activeProjectId })
      },

      importProjects: (projects, activeId = null) => {
        set({
          projects,
          activeProjectId: activeId || (projects[0]?.id || null)
        })
      }
    }),
    {
      name: STORAGE_KEYS.PROJECTS,
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId
      })
    }
  )
)
