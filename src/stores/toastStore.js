import { create } from 'zustand'
import { generateId } from '../utils/idUtils'

const createToast = (message, type = 'info', duration = 3000) => ({
  id: generateId('toast_'),
  message,
  type,
  duration
})

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 3000) => {
    const toast = createToast(message, type, duration)
    set({ toasts: [...get().toasts, toast] })
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(toast.id)
      }, duration)
    }
    return toast.id
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },

  clearToasts: () => set({ toasts: [] }),

  success: (msg, duration) => get().addToast(msg, 'success', duration),
  error: (msg, duration) => get().addToast(msg, 'error', duration),
  warning: (msg, duration) => get().addToast(msg, 'warning', duration),
  info: (msg, duration) => get().addToast(msg, 'info', duration)
}))
