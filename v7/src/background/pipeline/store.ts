import type { Run, EventRec } from './types'

import { getActiveRunId } from '@/shared/activeRun'

const k = (tabId: number) => `run:${tabId}`

const get = async (tabId: number): Promise<Run | null> => {
  const { [k(tabId)]: v } = await chrome.storage.session.get(k(tabId))
  return (v as Run) || null
}

const set = async (tabId: number, run: Run) => {
  await chrome.storage.session.set({ [k(tabId)]: run })
}

export const addEvent = async (tabId: number, ev: EventRec) => {
  const existing = await get(tabId)

  // If no run exists in storage, check if one is actively executing
  if (!existing) {
    const activeRunId = await getActiveRunId(tabId)
    if (activeRunId) {
      // A run is actively executing (storage empty because popRun removed it)
      // Don't create a new run - these events arrived after the alarm fired
      return
    }
    // No active run, so create a new run for these events
  }

  const r = existing || { id: Date.now(), ev: [] }
  r.ev.push(ev)
  await set(tabId, r)
}

export const setDomDone = async (tabId: number) => {
  const existing = await get(tabId)

  // If no run exists in storage, check if one is actively executing
  if (!existing) {
    const activeRunId = await getActiveRunId(tabId)
    if (activeRunId) {
      // A run is actively executing - don't create a new run
      return
    }
    // No active run, so create a new run
  }

  const r = existing || { id: Date.now(), ev: [] }
  r.domDone = true
  await set(tabId, r)
}

export const popRun = async (tabId: number): Promise<Run | null> => {
  const r = await get(tabId)
  await chrome.storage.session.remove(k(tabId))
  return r
}

