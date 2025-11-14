/**
 * Storage Operations with Logging - DRY storage operations
 */

import { Logger } from './logger.js'
import { getDataSize } from './storage-helpers.js'

export async function loggedStorageGet<T>(storage: chrome.storage.StorageArea, type: string, keys: string | string[] | null = null): Promise<{ [key: string]: T }> {
  const keyArray = keys === null ? ['*'] : Array.isArray(keys) ? keys : [keys]
  Logger.logSync('storage', 'read start', { type, keys: keyArray.join(',') })
  try {
    const result = await storage.get(keys)
    const foundKeys = Object.keys(result)
    const size = getDataSize(result)
    await Logger.log('storage', 'read done', { type, requested: keyArray.join(','), found: foundKeys.length, keys: foundKeys.join(','), size })
    return result as { [key: string]: T }
  } catch (error) {
    await Logger.logError('storage get', error, { type, keys: keyArray.join(',') })
    throw error
  }
}

export async function loggedStorageSet(storage: chrome.storage.StorageArea, type: string, data: { [key: string]: unknown }): Promise<void> {
  const keys = Object.keys(data)
  const size = getDataSize(data)
  Logger.logSync('storage', 'write start', { type, keys: keys.join(','), size })
  try {
    await storage.set(data)
    await Logger.log('storage', 'write done', { type, keys: keys.join(','), size })
  } catch (error) {
    await Logger.logError('storage set', error, { type, keys: keys.join(',') })
    throw error
  }
}

export async function loggedStorageRemove(storage: chrome.storage.StorageArea, type: string, keys: string | string[]): Promise<void> {
  const keyArray = Array.isArray(keys) ? keys : [keys]
  Logger.logSync('storage', 'remove start', { type, keys: keyArray.join(',') })
  try {
    await storage.remove(keys)
    await Logger.log('storage', 'remove done', { type, keys: keyArray.join(',') })
  } catch (error) {
    await Logger.logError('storage remove', error, { type, keys: keyArray.join(',') })
    throw error
  }
}

export async function loggedStorageClear(storage: chrome.storage.StorageArea, type: string): Promise<void> {
  Logger.logSync('storage', 'clear start', { type })
  try {
    await storage.clear()
    await Logger.log('storage', 'clear done', { type })
  } catch (error) {
    await Logger.logError('storage clear', error, { type })
    throw error
  }
}

export async function loggedStorageGetBytesInUse(storage: chrome.storage.StorageArea, type: string, keys?: string | string[] | null): Promise<number> {
  try {
    const bytes = await storage.getBytesInUse(keys ?? null)
    await Logger.log('storage', 'quota check', { type, keys: keys ? (Array.isArray(keys) ? keys.join(',') : keys) : 'all', bytes })
    return bytes
  } catch (error) {
    await Logger.logError('storage getBytesInUse', error, { type })
    throw error
  }
}
