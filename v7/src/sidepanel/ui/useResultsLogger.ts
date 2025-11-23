import { useEffect } from 'react'

type LogFn = (action: string, data?: Record<string, unknown>) => void
type Payload = { filtered: number; raw: number; runId: string }

export const useResultsLogger = (logUi: LogFn, data: Payload) => {
  useEffect(() => {
    logUi('sidepanel:results-update', data)
  }, [logUi, data])
}
