import { useEffect, useState } from 'react'

import { getLogs, SYSTEM_TAB_ID } from '@/shared/logs'

export const AuthLogsViewer = () => {
  const [authLogs, setAuthLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logs = await getLogs(SYSTEM_TAB_ID)
        const authOnly = logs.filter(log => log.includes('auth:'))
        setAuthLogs(authOnly.slice(-10))
      } catch (error) {
        console.error('Failed to fetch auth logs:', error)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-700">
          Authentication Logs (Live)
        </h3>
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showLogs ? 'Hide' : 'Show'}
        </button>
      </div>
      {showLogs && (
        <div className="bg-black text-green-400 p-3 rounded font-mono text-xs max-h-64 overflow-y-auto">
          {authLogs.length === 0 ? (
            <div className="text-gray-500">
              No auth logs yet. Click "Sign In" to see activity.
            </div>
          ) : (
            authLogs.map((log, i) => (
              <div key={i} className="mb-1 break-all">{log}</div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
