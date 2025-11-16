import { useState, useEffect } from 'react'

export type ToastMessage = {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

// Simple event-based toast manager (no external libraries)
let toastId = 0
const toastListeners = new Set<(toast: ToastMessage) => void>()

/**
 * Show a toast notification
 *
 * @param message - Message to display
 * @param type - Type of notification (success, error, info)
 *
 * @example
 * ```typescript
 * showToast('Settings saved', 'success')
 * showToast('Invalid API key', 'error')
 * ```
 */
export const showToast = (
  message: string,
  type: ToastMessage['type'] = 'success'
) => {
  const toast: ToastMessage = { id: toastId++, message, type }
  toastListeners.forEach(fn => fn(toast))
}

/**
 * Toast notification component
 *
 * Place once in your app (e.g., in SettingsApp or root component)
 */
export const Toast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handler = (toast: ToastMessage) => {
      setToasts(prev => [...prev, toast])

      // Auto-remove after 3 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 3000)
    }

    toastListeners.add(handler)
    return () => { toastListeners.delete(handler) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-lg shadow-lg text-white text-sm
            ${toast.type === 'success' && 'bg-green-600'}
            ${toast.type === 'error' && 'bg-red-600'}
            ${toast.type === 'info' && 'bg-blue-600'}
          `}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
