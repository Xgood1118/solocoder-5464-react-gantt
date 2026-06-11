import { useEffect } from 'react'

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(onClose, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast, onClose])

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  return (
    <div className={`toast ${toast.type}`}>
      <span style={{ fontWeight: 600 }}>{icons[toast.type] || 'ℹ'}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={onClose} style={{ padding: '0 4px', fontSize: 14 }}>×</button>
    </div>
  )
}
