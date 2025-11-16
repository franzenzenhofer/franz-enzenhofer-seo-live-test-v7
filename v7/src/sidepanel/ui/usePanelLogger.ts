import { useCallback } from 'react'

import { Logger } from '@/shared/logger'

export type LogFn = (action: string, data?: Record<string, unknown>) => void

export const usePanelLogger = (tabId: number | null): LogFn => {
  return useCallback<LogFn>((action, data) => {
    if (tabId) {
      Logger.logDirectSend(tabId, 'ui', action, data)
    } else {
      Logger.log('ui', action, data).catch(() => {})
    }
  }, [tabId])
}
