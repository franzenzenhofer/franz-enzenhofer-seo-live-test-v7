import type { RunStatus } from '@/shared/runStatus'

export type SessionStatus = Exclude<RunStatus, 'pending'>
export type SessionRecord = {
  tabId: number; runId: string; status: SessionStatus; startedAt: string
  /** Monotonic run generation: an older run may never supersede a newer one. */
  generation: number
  reason?: string; controller: AbortController
}

const sessions = new Map<number, SessionRecord>()
const queues = new Map<number, Promise<unknown>>()
const keyFor = (tabId: number) => `run-session:${tabId}`

export const serializeSession = <T>(tabId: number, task: () => Promise<T>): Promise<T> => {
  const next = (queues.get(tabId) || Promise.resolve()).then(task, task)
  queues.set(tabId, next.then(() => undefined, () => undefined))
  return next
}

export const getSession = async (tabId: number): Promise<SessionRecord | null> => {
  if (sessions.has(tabId)) return sessions.get(tabId)!
  const key = keyFor(tabId)
  const data = await chrome.storage.session.get(key)
  if (!data[key]) return null
  // Rehydrated after a service-worker restart: the original controller died
  // with the worker, so this one only carries the identity forward.
  const stored = data[key] as Omit<SessionRecord, 'controller'>
  const session = { ...stored, tabId, controller: new AbortController() }
  sessions.set(tabId, session)
  return session
}

export const saveSession = async (tabId: number, session: SessionRecord) => {
  sessions.set(tabId, session)
  const { runId, status, startedAt, reason, generation } = session
  await chrome.storage.session.set({ [keyFor(tabId)]: { runId, status, startedAt, reason, generation } })
}

export const clearSession = async (tabId: number) => {
  sessions.delete(tabId)
  await chrome.storage.session.remove(keyFor(tabId))
}
