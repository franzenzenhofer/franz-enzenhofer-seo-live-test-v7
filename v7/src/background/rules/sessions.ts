import { clearSession, getSession, saveSession, serializeSession, type SessionStatus } from './sessionStore'

export { getSession }

/**
 * Claims the tab for `runId`. Returns null when a NEWER run already owns the
 * tab: an older finalize that resolved its page URL late must never supersede
 * (and thereby abort) the run that overtook it.
 */
export const startSession = (tabId: number, runId: string, generation = Date.now()) =>
  serializeSession(tabId, async (): Promise<AbortSignal | null> => {
    const previous = await getSession(tabId)
    if (previous && previous.generation > generation) return null
    if (previous) {
      previous.reason = 'superseded'
      previous.controller.abort('superseded')
    }
    const session = {
      tabId,
      runId,
      generation,
      status: 'running' as const,
      startedAt: new Date().toISOString(),
      controller: new AbortController(),
    }
    await saveSession(tabId, session)
    return session.controller.signal
  })

// Aborting drops the record: the tab is gone or navigating away, and nothing
// may write under that identity again.
export const abortSession = (tabId: number, reason = 'aborted') => serializeSession(tabId, async () => {
  const session = await getSession(tabId)
  if (!session) return null
  session.controller.abort(reason)
  await clearSession(tabId)
  return session.runId
})

// Finishing keeps the terminal status readable, and - because it is no longer
// 'running' - withActiveSession rejects every late write from that run.
export const finishSession = (tabId: number, status: Exclude<SessionStatus, 'running'>, runId: string) => serializeSession(tabId, async () => {
  const session = await getSession(tabId)
  if (!session || session.runId !== runId) return null
  session.status = status
  await saveSession(tabId, session)
  return session.runId
})

export const withActiveSession = <T>(tabId: number, runId: string, task: () => Promise<T>) =>
  serializeSession(tabId, async () => await isSessionActive(tabId, runId) ? task() : undefined)

export const isSessionActive = async (tabId: number, runId?: string) => {
  const current = await getSession(tabId)
  if (!current) return false
  if (runId && current.runId !== runId) return false
  return current.status === 'running'
}
