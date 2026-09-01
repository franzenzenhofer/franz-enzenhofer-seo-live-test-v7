import type { Run, EventRec } from './types'
import { getRun, MAX_EVENTS, removeRunState, setRun } from './storeCore'
import { addResource, flushResources, isResourceEvent, RESOURCE_LIMITS } from './storeResources'
import { serializePerTab } from './tabSerial'

export { RESOURCE_LIMITS }

const addEventUnsafe = async (tabId: number, ev: EventRec) => {
  if (isResourceEvent(ev)) { await addResource(tabId, ev.u); return }
  const r = (await getRun(tabId)) || { id: Date.now(), ev: [] }
  r.ev.push(ev)
  if (r.ev.length > MAX_EVENTS) {
    r.ev = r.ev.slice(-MAX_EVENTS)
    r.eventDropped = (r.eventDropped || 0) + 1
  }
  await setRun(tabId, r)
}

const setDomDoneUnsafe = async (tabId: number) => {
  await flushResources(tabId)
  const r = (await getRun(tabId)) || { id: Date.now(), ev: [] }
  r.domDone = true
  await setRun(tabId, r)
}

const popRunUnsafe = async (tabId: number): Promise<Run | null> => {
  await flushResources(tabId)
  const r = await getRun(tabId)
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

export const setDomDone = (tabId: number) => serializePerTab(tabId, () => setDomDoneUnsafe(tabId))

export const popRun = (tabId: number) => serializePerTab(tabId, () => popRunUnsafe(tabId))

export const peekRun = (tabId: number) => serializePerTab(tabId, () => peekRunUnsafe(tabId))

export const resetRun = (tabId: number) => serializePerTab(tabId, () => removeRunState(tabId))
