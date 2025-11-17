import React, { useEffect, useState } from 'react'

import { RunHistoryView } from './RunHistoryView'

import type { RunState } from '@/background/rules/runState'
import { readRunHistory } from '@/shared/runHistory'

export const RunHistoryApp = (): React.JSX.Element => {
  const [history, setHistory] = useState<RunState[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async (): Promise<void> => {
      try {
        const runs = await readRunHistory()
        setHistory(runs)
      } catch (error) {
        console.error('Failed to load run history:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()

    // Listen for storage changes
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
    ): void => {
      if (changes['run-history']) {
        loadHistory()
      }
    }

    chrome.storage.local.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.local.onChanged.removeListener(handleStorageChange)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <RunHistoryView history={history} loading={loading} />
      </div>
    </div>
  )
}
