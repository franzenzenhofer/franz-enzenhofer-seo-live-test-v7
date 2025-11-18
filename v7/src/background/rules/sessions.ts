type SessionStatus = 'running' | 'completed' | 'error' | 'aborted' | 'skipped'

type SessionRecord = {
  tabId: number
  runId: string
  status: SessionStatus
  startedAt: string
  reason?: string
  controller: AbortController
}

const KEY = (tabId: number) => `run-session:${tabId}`
const sessions = new Map<number, SessionRecord>()

const persist = async (tabId: number, snapshot?: SessionRecord) => {
  const key = KEY(tabId)
  if (!snapshot) {
    await chrome.storage.session.remove(key)
    return
  }
  const { runId, status, startedAt, reason } = snapshot
  await chrome.storage.session.set({ [key]: { runId, status, startedAt, reason: reason || null } })
}

export const startSession = async (tabId: number, runId: string) => {
  const session: SessionRecord = {
    tabId,
    runId,
    status: 'running',
    startedAt: new Date().toISOString(),
    controller: new AbortController(),
  }
  sessions.set(tabId, session)
  await persist(tabId, session)
  return session.controller.signal
}

export const abortSession = async (tabId: number, reason = 'aborted') => {
  const session = sessions.get(tabId)
  if (!session) return null
  session.status = 'aborted'
  session.reason = reason
  session.controller.abort()
  sessions.delete(tabId)
  await persist(tabId)
  return session.runId
}

export const finishSession = async (tabId: number, status: Exclude<SessionStatus, 'running'>) => {
  const session = sessions.get(tabId)
  if (!session) return null
  session.status = status
  sessions.delete(tabId)
  await persist(tabId)
  return session.runId
}

export const isSessionActive = (tabId: number, runId?: string) => {
  const current = sessions.get(tabId)
  if (!current) return false
  if (runId && current.runId !== runId) return false
  return current.status === 'running'
}
