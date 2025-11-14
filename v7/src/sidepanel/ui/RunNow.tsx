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
      className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
        running
          ? 'bg-blue-100 text-blue-700 cursor-wait'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
      onClick={run}
      disabled={running}
    >
      {running ? 'Running…' : 'Reload Page & Run'}
    </button>
  )
}
