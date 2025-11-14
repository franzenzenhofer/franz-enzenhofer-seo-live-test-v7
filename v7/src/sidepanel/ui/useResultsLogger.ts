import { useEffect } from 'react'

type LogFn = (action: string, data?: Record<string, unknown>) => void

export const useResultsLogger = (logUi: LogFn, total: number) => {
  useEffect(() => {
    logUi('sidepanel:results-update', { totalResults: total })
  }, [logUi, total])
}
