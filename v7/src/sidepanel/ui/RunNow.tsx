import React, { useState } from 'react'

import { getActiveTabId } from '@/shared/chrome'
import { clearResults } from '@/shared/results'

export const RunNow = () => {
  const [running, setRunning] = useState(false)

  const run = async () => {
    const tabId = await getActiveTabId()
    if (!tabId) return

    setRunning(true)
    try {
      // Clear previous results if autoClear is enabled
      const { 'ui:autoClear': autoClear } = await chrome.storage.local.get('ui:autoClear')
      if (autoClear !== false) {
        await clearResults(tabId)
      }

      await chrome.runtime.sendMessage({ type: 'panel:runNow', tabId })

      // Keep running state for a bit to show tests are executing
      setTimeout(() => setRunning(false), 2000)
    } catch {
      setRunning(false)
    }
  }

  return (
    <button
      className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
        running
          ? 'bg-blue-100 text-blue-700 cursor-wait'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
      onClick={run}
      disabled={running}
    >
      {running ? 'Running...' : 'Run Now'}
    </button>
  )
}
