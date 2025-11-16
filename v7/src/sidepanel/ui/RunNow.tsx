import React, { useState, useEffect, useRef } from 'react'

import { executeRunNow } from '../utils/runNow'

import { getActiveTabId } from '@/shared/chrome'
import { watchRunMeta } from '@/shared/runMeta'

export const RunNow = ({ url }: { url?: string }) => {
  const [running, setRunning] = useState(false)
  const currentRunIdRef = useRef<string | null>(null)
  const [tabId, setTabId] = useState<number | null>(null)

  // Get tab ID on mount
  useEffect(() => {
    getActiveTabId().then(setTabId).catch(() => {})
  }, [])

  // Watch for run completion
  useEffect(() => {
    if (!tabId || !currentRunIdRef.current) return

    const expectedRunId = currentRunIdRef.current
    const unwatch = watchRunMeta(tabId, (meta) => {
      if (meta?.runId === expectedRunId) {
        // This run has completed
        setRunning(false)
        currentRunIdRef.current = null
      }
    })

    return unwatch
  }, [tabId, running])

  const run = async () => {
    setRunning(true)
    try {
      const runId = await executeRunNow(url)
      currentRunIdRef.current = runId
      // Don't set running=false here - wait for runMeta to update
    } catch (err) {
      console.warn('[panel] Run Now failed', err)
      setRunning(false)
      currentRunIdRef.current = null
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
