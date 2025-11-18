import type { RunStatus } from '@/shared/runStatus'

type SessionStatus = Exclude<RunStatus, 'pending'>
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

const persist = async (tabId: number, snapshot?: Omit<SessionRecord, 'controller'>) => {
  const key = KEY(tabId)
  if (snapshot) {
    const { runId, status, startedAt, reason } = snapshot
    await chrome.storage.session.set({ [key]: { runId, status, startedAt, reason: reason || null } })
  } else {
    await chrome.storage.session.remove(key)
  }
}

export const getSession = async (tabId: number): Promise<SessionRecord | null> => {
  if (sessions.has(tabId)) return sessions.get(tabId)!
  const key = KEY(tabId)
  const data = await chrome.storage.session.get(key)
  if (!data[key]) return null
  const stored = data[key] as Omit<SessionRecord, 'controller'>
  const session: SessionRecord = { ...stored, tabId, controller: new AbortController() }
  sessions.set(tabId, session)
  return session
}

export const startSession = async (tabId: number, runId: string) => {
  const previous = await getSession(tabId)
  if (previous) {
    previous.status = 'aborted'
    previous.reason = 'superseded'
    previous.controller.abort()
    sessions.delete(tabId)
  }
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
  const session = await getSession(tabId)
  if (!session) return null
  session.status = 'aborted'
  session.reason = reason
  session.controller.abort()
  sessions.delete(tabId)
  await persist(tabId)
  return session.runId
}

export const finishSession = async (tabId: number, status: Exclude<SessionStatus, 'running'>) => {
  const session = await getSession(tabId)
  if (!session) return null
  session.status = status
  sessions.delete(tabId)
  await persist(tabId)
  return session.runId
}

export const isSessionActive = async (tabId: number, runId?: string) => {
  const current = await getSession(tabId)
  if (!current) return false
  if (runId && current.runId !== runId) return false
  return current.status === 'running'
}
