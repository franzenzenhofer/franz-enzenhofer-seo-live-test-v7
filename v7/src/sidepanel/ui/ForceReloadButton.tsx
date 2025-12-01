import { useState } from 'react'

import { executeRunNow } from '../utils/runNow'

export const ForceReloadButton = ({ url }: { url?: string }) => {
  const [running, setRunning] = useState(false)

  const handleForceReload = async (): Promise<void> => {
    setRunning(true)
    try {
      await executeRunNow(url)
    } catch (err) {
      console.warn('[ForceReloadButton] Force Reload failed', err)
    } finally {
      setRunning(false)
    }
  }

  return (
    <button
      className={`w-full px-4 py-3 text-base font-semibold rounded transition-colors ${
        running ? 'bg-blue-100 text-blue-700 cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
      onClick={() => void handleForceReload()}
      disabled={running}
      type="button"
    >
      {running ? 'Reloading…' : 'Force Reload'}
    </button>
  )
}
