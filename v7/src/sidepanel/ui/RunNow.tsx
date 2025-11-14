import React, { useState } from 'react'

import { executeRunNow } from '../utils/runNow'

export const RunNow = () => {
  const [running, setRunning] = useState(false)

  const run = async () => {
    setRunning(true)
    try {
      await executeRunNow()
    } catch (err) {
      console.warn('[panel] Run Now failed', err)
    } finally {
      setRunning(false)
    }
  }

  return (
    <button
      className={`w-full px-4 py-2 text-sm font-semibold rounded transition-colors ${
        running ? 'bg-blue-100 text-blue-700 cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
      onClick={run}
      disabled={running}
    >
      {running ? 'Running…' : 'Hard Reload'}
    </button>
  )
}
