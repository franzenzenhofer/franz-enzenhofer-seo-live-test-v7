import type { Run, EventRec } from './types'

const k = (tabId: number) => `run:${tabId}`

const get = async (tabId: number): Promise<Run | null> => {
  const { [k(tabId)]: v } = await chrome.storage.session.get(k(tabId))
  return (v as Run) || null
}

const set = async (tabId: number, run: Run) => {
  await chrome.storage.session.set({ [k(tabId)]: run })
}

export const addEvent = async (tabId: number, ev: EventRec) => {
  const r = (await get(tabId)) || { id: Date.now(), ev: [] }
  r.ev.push(ev)
  await set(tabId, r)
}

export const setDomDone = async (tabId: number) => {
  const r = (await get(tabId)) || { id: Date.now(), ev: [] }
  r.domDone = true
  await set(tabId, r)
}

export const popRun = async (tabId: number): Promise<Run | null> => {
  const r = await get(tabId)
  await chrome.storage.session.remove(k(tabId))
  return r
}

