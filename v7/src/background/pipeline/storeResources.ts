import type { EventRec } from './types'
import { getRun, resourceKey, setRun } from './storeCore'

export const RESOURCE_LIMITS = { batch: 50, urls: 1_000 } as const

type ResourceBatch = { urls: string[]; total: number }

export const isResourceEvent = (event: EventRec) => event.t.startsWith('req:') && !event.t.startsWith('req:main')

export const flushResources = async (tabId: number) => {
  const key = resourceKey(tabId)
  const { [key]: raw } = await chrome.storage.session.get(key)
  const batch = raw as ResourceBatch | undefined
  if (!batch?.total) return
  const r = (await getRun(tabId)) || { id: Date.now(), ev: [] }
  const previous = r.resources || { urls: [], total: 0, dropped: 0 }
  const urls = [...previous.urls]
  for (const url of batch.urls) {
    if (urls.includes(url)) continue
    if (urls.length < RESOURCE_LIMITS.urls) urls.push(url)
  }
  r.resources = { urls, total: previous.total + batch.total, dropped: previous.total + batch.total - urls.length }
  await setRun(tabId, r)
  await chrome.storage.session.remove(key)
}

export const addResource = async (tabId: number, url?: string) => {
  const key = resourceKey(tabId)
  const { [key]: raw } = await chrome.storage.session.get(key)
  const batch = (raw as ResourceBatch | undefined) || { urls: [], total: 0 }
  const urls = url && !batch.urls.includes(url) ? [...batch.urls, url] : batch.urls
  const next = { urls, total: batch.total + 1 }
  await chrome.storage.session.set({ [key]: next })
  if (next.total >= RESOURCE_LIMITS.batch) await flushResources(tabId)
}
