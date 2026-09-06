import type { Run, EventRec } from './types'
import { getRun, MAX_EVENTS, removeRunState, setRun } from './storeCore'
import { addResource, flushResources, isResourceEvent, RESOURCE_LIMITS } from './storeResources'
import { serializePerTab } from './tabSerial'
import { phaseEventState } from './phaseProgress'

export { RESOURCE_LIMITS }

const addEventUnsafe = async (tabId: number, ev: EventRec) => {
  if (isResourceEvent(ev)) {
    // Subresources answer to the same document identity as phase events: a
    // request belonging to a superseded document is not this run's evidence.
    const current = await getRun(tabId)
    if (ev.documentId && current?.documentId && ev.documentId !== current.documentId) return false
    await addResource(tabId, ev)
    return true
  }
  const r = (await getRun(tabId)) || { id: Date.now(), ev: [] }
  if (ev.documentId && r.documentId && ev.documentId !== r.documentId) return false
  const phaseState = phaseEventState(r.ev, ev)
  if (phaseState === 'invalid') return false
  if (phaseState === 'duplicate') return true
  if (ev.documentId) r.documentId = ev.documentId
  r.ev.push(ev)
  if (r.ev.length > MAX_EVENTS) {
    r.ev = r.ev.slice(-MAX_EVENTS)
    r.eventDropped = (r.eventDropped || 0) + 1
  }
  await setRun(tabId, r)
  return true
}

/**
 * 'stale' - the idle phase belongs to a document this run no longer tracks.
 * 'awaiting-static' - the static phase has not reported yet, so finalizing now
 * would drop its rules; the caller must wait for it instead of racing it.
 */
export type DomPhaseState = 'ready' | 'awaiting-static' | 'stale'

const setDomDoneUnsafe = async (tabId: number, documentId?: string): Promise<DomPhaseState> => {
  await flushResources(tabId)
  const r = await getRun(tabId)
  if (!r) return 'stale'
  if (documentId && r.documentId && r.documentId !== documentId) return 'stale'
  r.domDone = true
  await setRun(tabId, r)
  return r.ev.some((e) => e.t === 'dom:document_end') ? 'ready' : 'awaiting-static'
}

const popRunUnsafe = async (tabId: number, expectedId?: number): Promise<Run | null> => {
  await flushResources(tabId)
  const r = await getRun(tabId)
  if (expectedId !== undefined && r?.id !== expectedId) return null
  await removeRunState(tabId)
  return r
}

const peekRunUnsafe = async (tabId: number): Promise<Run | null> => {
  await flushResources(tabId)
  return getRun(tabId)
}

// All mutations of run:<tabId> are read-modify-write on chrome.storage.session
// and MUST NOT interleave; callers fire them concurrently (webRequest bursts,
// phase-result chunks, markDomPhase racing pushEvent), so every entry point is
// serialized per tab.
export const addEvent = (tabId: number, ev: EventRec) => serializePerTab(tabId, () => addEventUnsafe(tabId, ev))

export const setDomDone = (tabId: number, documentId?: string) =>
  serializePerTab(tabId, () => setDomDoneUnsafe(tabId, documentId))

export const popRun = (tabId: number, expectedId?: number) => serializePerTab(tabId, () => popRunUnsafe(tabId, expectedId))

export const peekRun = (tabId: number) => serializePerTab(tabId, () => peekRunUnsafe(tabId))

export const resetRun = (tabId: number) => serializePerTab(tabId, () => removeRunState(tabId))
