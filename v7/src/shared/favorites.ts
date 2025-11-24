import { STORAGE_KEYS } from './storage-keys'

export const PINNED_RULE_STORAGE_KEY = STORAGE_KEYS.UI.PINNED_RULES

export const DEFAULT_FAVORITES = [
  'head-title',           // Title Present
  'head:title',           // Title Length
  'head-canonical',       // Canonical Link
  'body:h1',              // H1 Present
  'head-meta-description' // Meta Description
] as const

export const toPinnedRecord = (ids: string[]): Record<string, boolean> =>
  ids.reduce<Record<string, boolean>>((acc, id) => {
    acc[id] = true
    return acc
  }, {})

export const readPinnedRules = async (): Promise<Record<string, boolean>> => {
  const { [PINNED_RULE_STORAGE_KEY]: stored } = await chrome.storage.local.get(PINNED_RULE_STORAGE_KEY)
  return (stored as Record<string, boolean>) || {}
}

export const savePinnedRules = async (pinned: Record<string, boolean>): Promise<void> => {
  await chrome.storage.local.set({ [PINNED_RULE_STORAGE_KEY]: pinned })
}
