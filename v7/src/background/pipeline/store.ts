import type { Run, EventRec } from './types'

const k = (tabId: number) => `run:${tabId}`
const resourceKey = (tabId: number) => `run:resources:${tabId}`
const MAX_EVENTS = 64
export const RESOURCE_LIMITS = { batch: 50, urls: 1_000 } as const
type ResourceBatch = { urls: string[]; total: number }

const get = async (tabId: number): Promise<Run | null> => {
  const { [k(tabId)]: v } = await chrome.storage.session.get(k(tabId))
  return (v as Run) || null
}

const set = async (tabId: number, run: Run) => {
  await chrome.storage.session.set({ [k(tabId)]: run })
}

export const resetRun = async (tabId: number) => {
  await Promise.all([chrome.storage.session.remove(k(tabId)), chrome.storage.session.remove(resourceKey(tabId))])
}

const isResourceEvent = (event: EventRec) => event.t.startsWith('req:') && !event.t.startsWith('req:main')

const flushResources = async (tabId: number) => {
  const key = resourceKey(tabId)
  const { [key]: raw } = await chrome.storage.session.get(key)
  const batch = raw as ResourceBatch | undefined
  if (!batch?.total) return
  const r = (await get(tabId)) || { id: Date.now(), ev: [] }
  const previous = r.resources || { urls: [], total: 0, dropped: 0 }
  const urls = [...previous.urls]
  for (const url of batch.urls) {
    if (urls.includes(url)) continue
    if (urls.length < RESOURCE_LIMITS.urls) urls.push(url)
  }
  r.resources = { urls, total: previous.total + batch.total, dropped: previous.total + batch.total - urls.length }
  await set(tabId, r)
  await chrome.storage.session.remove(key)
}

const addResource = async (tabId: number, url?: string) => {
  const key = resourceKey(tabId)
  const { [key]: raw } = await chrome.storage.session.get(key)
  const batch = (raw as ResourceBatch | undefined) || { urls: [], total: 0 }
  const urls = url && !batch.urls.includes(url) ? [...batch.urls, url] : batch.urls
  const next = { urls, total: batch.total + 1 }
  await chrome.storage.session.set({ [key]: next })
  if (next.total >= RESOURCE_LIMITS.batch) await flushResources(tabId)
}

export const addEvent = async (tabId: number, ev: EventRec) => {
  if (isResourceEvent(ev)) { await addResource(tabId, ev.u); return }
  const r = (await get(tabId)) || { id: Date.now(), ev: [] }
  r.ev.push(ev)
  if (r.ev.length > MAX_EVENTS) {
    r.ev = r.ev.slice(-MAX_EVENTS)
    r.eventDropped = (r.eventDropped || 0) + 1
  }
  await set(tabId, r)
}

export const setDomDone = async (tabId: number) => {
  await flushResources(tabId)
  const r = (await get(tabId)) || { id: Date.now(), ev: [] }
  r.domDone = true
  await set(tabId, r)
}

export const popRun = async (tabId: number): Promise<Run | null> => {
  await flushResources(tabId)
  const r = await get(tabId)
  await resetRun(tabId)
  return r
}
