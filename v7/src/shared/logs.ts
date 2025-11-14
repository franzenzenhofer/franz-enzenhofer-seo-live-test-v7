import {
  appendLogEntry,
  appendSystemLogEntry,
  clearLogsFromSession,
  clearSystemLogsFromSession,
  ensureTabId,
  hasSessionAccess,
  readLogsFromSession,
  readSystemLogsFromSession,
  SYSTEM_TAB_ID,
} from './logStore'

type LogsCommand = 'logs:get' | 'logs:clear'
type LogsGetResponse = { logs: string[] }
type LogsClearResponse = { ok: true }
type LogsErrorResponse = { error: string }

const hasRuntimeMessaging = () => typeof chrome !== 'undefined' && !!chrome?.runtime?.sendMessage
const isErrorResponse = (payload: unknown): payload is LogsErrorResponse =>
  typeof payload === 'object' && payload !== null && 'error' in payload

const sendLogsMessage = async <T>(type: LogsCommand, tabId: number): Promise<T> => {
  if (!hasRuntimeMessaging()) throw new Error('[logs] chrome.runtime.sendMessage is unavailable')
  const response = await chrome.runtime.sendMessage({ type, tabId })
  if (isErrorResponse(response)) throw new Error(response.error)
  if (!response || typeof response !== 'object') throw new Error('[logs] Invalid response from background')
  return response as T
}

const formatEntry = (tab: string, message: string) => `[${new Date().toISOString()}] tab=${tab} ${message}`

export const log = async (tabId: number, message: string) => {
  await appendLogEntry(tabId, formatEntry(String(tabId), message))
}

export const logSystem = async (message: string) => {
  await appendSystemLogEntry(formatEntry('system', message))
}

export const getLogs = async (tabId: number) => {
  if (tabId === SYSTEM_TAB_ID) {
    if (hasSessionAccess()) return readSystemLogsFromSession()
    const { logs } = await sendLogsMessage<LogsGetResponse>('logs:get', SYSTEM_TAB_ID)
    return Array.isArray(logs) ? logs : []
  }
  ensureTabId(tabId)
  if (hasSessionAccess()) return readLogsFromSession(tabId)
  const { logs } = await sendLogsMessage<LogsGetResponse>('logs:get', tabId)
  return Array.isArray(logs) ? logs : []
}

export const clearLogs = async (tabId: number) => {
  if (tabId === SYSTEM_TAB_ID) {
    if (hasSessionAccess()) return clearSystemLogsFromSession()
    await sendLogsMessage<LogsClearResponse>('logs:clear', SYSTEM_TAB_ID)
    return
  }
  ensureTabId(tabId)
  if (hasSessionAccess()) return clearLogsFromSession(tabId)
  await sendLogsMessage<LogsClearResponse>('logs:clear', tabId)
}

export const getAllLogs = async () => {
  if (!hasSessionAccess()) throw new Error('[logs] chrome.storage.session is unavailable in this context')
  const all = await chrome.storage.session.get(null)
  const entries = Object.entries(all)
    .filter(([key]) => key.startsWith('logs:'))
    .flatMap(([, value]) => (Array.isArray(value) ? (value as string[]) : []))
    .sort()
  return entries
}

export const clearAllLogs = async () => {
  if (!hasSessionAccess()) throw new Error('[logs] chrome.storage.session is unavailable in this context')
  const all = await chrome.storage.session.get(null)
  const logKeys = Object.keys(all).filter((key) => key.startsWith('logs:'))
  await chrome.storage.session.remove(logKeys)
}

export { isValidTabId, SYSTEM_TAB_ID } from './logStore'
