import {
  clearLogsFromSession,
  clearSystemLogsFromSession,
  isValidTabId,
  readLogsFromSession,
  readSystemLogsFromSession,
  SYSTEM_TAB_ID,
} from '@/shared/logStore'

type SendFn = ((resp?: unknown) => void) | undefined

const sendError = (send: SendFn, err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error('[bg][logs]', message)
  send?.({ error: message })
}

const sendOk = (send: SendFn, payload: unknown) => { send?.(payload) }

const isAllowedTab = (tabId: number | null): tabId is number =>
  tabId === SYSTEM_TAB_ID || isValidTabId(tabId)

export const handleLogsBridgeMessage = (type: string | undefined, tabId: number | null, send: SendFn) => {
  if (type !== 'logs:get' && type !== 'logs:clear') return false
  if (!isAllowedTab(tabId)) {
    send?.({ error: 'Invalid tabId for logs request' })
    return true
  }
  if (type === 'logs:get') {
    ;(async () => {
      try {
        const logs = tabId === SYSTEM_TAB_ID ? await readSystemLogsFromSession() : await readLogsFromSession(tabId)
        sendOk(send, { logs })
      } catch (err) {
        sendError(send, err)
      }
    })()
    return true
  }
  ;(async () => {
    try {
      if (tabId === SYSTEM_TAB_ID) await clearSystemLogsFromSession()
      else await clearLogsFromSession(tabId)
      sendOk(send, { ok: true })
    } catch (err) {
      sendError(send, err)
    }
  })()
  return true
}
