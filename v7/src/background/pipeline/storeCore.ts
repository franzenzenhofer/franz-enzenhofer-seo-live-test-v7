import type { Run } from './types'

export const runKey = (tabId: number) => `run:${tabId}`
export const resourceKey = (tabId: number) => `run:resources:${tabId}`
export const MAX_EVENTS = 64

export const getRun = async (tabId: number): Promise<Run | null> => {
  const { [runKey(tabId)]: v } = await chrome.storage.session.get(runKey(tabId))
  return (v as Run) || null
}

export const setRun = async (tabId: number, run: Run) => {
  await chrome.storage.session.set({ [runKey(tabId)]: run })
}

export const removeRunState = async (tabId: number) => {
  await Promise.all([
    chrome.storage.session.remove(runKey(tabId)),
    chrome.storage.session.remove(resourceKey(tabId)),
  ])
}
