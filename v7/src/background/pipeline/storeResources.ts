import { emptyResourceLedger, mergeResourceObservations, observeResource, RESOURCE_LIMITS, type ResourceObservation } from './resourceLedger'
import { getRun, resourceKey, setRun } from './storeCore'
import type { EventRec } from './types'

export { RESOURCE_LIMITS }

export const isResourceEvent = (event: EventRec) => event.t.startsWith('req:') && !event.t.startsWith('req:main')

export const flushResources = async (tabId: number) => {
  const key = resourceKey(tabId)
  const { [key]: raw } = await chrome.storage.session.get(key)
  const batch = raw as ResourceObservation[] | undefined
  if (!batch?.length) return
  const run = (await getRun(tabId)) || { id: Date.now(), ev: [] }
  run.resources = mergeResourceObservations(run.resources || emptyResourceLedger(), batch)
  await setRun(tabId, run)
  await chrome.storage.session.remove(key)
}

// Resource callbacks arrive in bursts, so they are batched in session storage
// and merged into the run's ledger every RESOURCE_LIMITS.batch observations.
export const addResource = async (tabId: number, event: EventRec) => {
  const key = resourceKey(tabId)
  const { [key]: raw } = await chrome.storage.session.get(key)
  const batch = [...((raw as ResourceObservation[] | undefined) || []), observeResource(event)]
  await chrome.storage.session.set({ [key]: batch })
  if (batch.length >= RESOURCE_LIMITS.batch) await flushResources(tabId)
}
