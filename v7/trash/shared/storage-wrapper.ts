// Moved to trash on 2025-11-26: unused logged storage wrapper (no imports in runtime).
/**
 * Storage Wrapper with Automatic Logging - Super DRY
 */

import { Logger } from './logger.js'
import { getDataSize } from './storage-helpers.js'
import { loggedStorageGet, loggedStorageSet, loggedStorageRemove, loggedStorageClear, loggedStorageGetBytesInUse } from './storage-ops.js'

type StorageType = 'local' | 'session'

function createStorageWrapper(type: StorageType) {
  const chromeStorage = type === 'local' ? chrome.storage.local : chrome.storage.session
  return {
    async get<T = unknown>(keys: string | string[] | null = null): Promise<{ [key: string]: T }> {
      return loggedStorageGet<T>(chromeStorage, type, keys)
    },
    async set(data: { [key: string]: unknown }): Promise<void> {
      return loggedStorageSet(chromeStorage, type, data)
    },
    async remove(keys: string | string[]): Promise<void> {
      return loggedStorageRemove(chromeStorage, type, keys)
    },
    async clear(): Promise<void> {
      return loggedStorageClear(chromeStorage, type)
    },
    async getBytesInUse(keys?: string | string[] | null): Promise<number> {
      return loggedStorageGetBytesInUse(chromeStorage, type, keys)
    },
  }
}

export const storage = {
  local: createStorageWrapper('local'),
  session: createStorageWrapper('session'),
  onChanged: {
    addListener(callback: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        const changedKeys = Object.keys(changes)
        const details = changedKeys.map(key => {
          const change = changes[key]
          if (!change) return `${key}:(?→?)`
          return `${key}:(${getDataSize(change.oldValue)}→${getDataSize(change.newValue)})`
        })
        Logger.logSync('storage', 'changed', { area: areaName, keys: changedKeys.join(','), details: details.join(' ') })
        callback(changes, areaName)
      })
    },
  },
}
