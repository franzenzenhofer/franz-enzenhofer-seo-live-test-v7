import { STORAGE_KEYS } from './storage-keys'

const IMPORTANT = /(warn|error|crash|abort|runner:(counts|done|persist-error|state-created|skip))/i

export const shouldRetainLog = async (message: string): Promise<boolean> => {
  if (IMPORTANT.test(message)) return true
  const stored = await chrome.storage.local?.get(STORAGE_KEYS.UI.DEBUG).catch(() => ({})) as Record<string, unknown>
  return stored?.[STORAGE_KEYS.UI.DEBUG] === true
}
