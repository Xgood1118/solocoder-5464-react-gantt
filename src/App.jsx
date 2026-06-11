import { useEffect } from 'react'
import GanttChart from './components/GanttChart/GanttChart.jsx'
import Toast from './components/common/Toast.jsx'
import { useToastStore } from './stores/toastStore.js'
import { useHydrateStores } from './hooks/useHydrateStores.js'

export default function App() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)
  useHydrateStores()

  return (
    <div className="app">
      <GanttChart />
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  )
}
