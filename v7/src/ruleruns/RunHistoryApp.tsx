import React, { useCallback, useEffect, useState } from 'react'

import { RunHistoryView } from './RunHistoryView'

import type { RunState } from '@/background/rules/runState'
import { readRunHistory } from '@/shared/runHistory'
import { useStorageListener } from '@/shared/hooks/useStorageListener'

export const RunHistoryApp = (): React.JSX.Element => {
  const [history, setHistory] = useState<RunState[]>([])
  const [loading, setLoading] = useState(true)

  const loadHistory = useCallback(async (): Promise<void> => {
    try {
      const runs = await readRunHistory()
      setHistory(runs)
    } catch (error) {
      console.error('Failed to load run history:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadHistory() }, [loadHistory])

  useStorageListener('run-history', (_n, _o, area) => {
    if (area === 'local') void loadHistory()
  }, [loadHistory])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <RunHistoryView history={history} loading={loading} />
      </div>
    </div>
  )
}
