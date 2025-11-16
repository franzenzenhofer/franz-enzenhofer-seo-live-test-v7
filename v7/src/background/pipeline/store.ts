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

const ensureRun = async (tabId: number): Promise<Run | null> => {
  const existing = await get(tabId)
  if (existing) return existing
  const active = await getActiveRunId(tabId)
  if (active) return null
  return { id: Date.now(), ev: [] }
}

export const addEvent = async (tabId: number, ev: EventRec) => {
  const run = await ensureRun(tabId)
  if (!run) return
  run.ev.push(ev)
  await set(tabId, run)
}

export const setDomDone = async (tabId: number) => {
  const run = await ensureRun(tabId)
  if (!run) return
  run.domDone = true
  await set(tabId, run)
}

export const popRun = async (tabId: number): Promise<Run | null> => {
  const r = await get(tabId)
  await chrome.storage.session.remove(k(tabId))
  return r
}
