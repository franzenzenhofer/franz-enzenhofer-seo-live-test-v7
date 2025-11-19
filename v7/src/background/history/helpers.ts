import { NavigationHop, NavigationLedger } from './types'

export const MAX_TRACE_LENGTH = 50
export const STORAGE_KEY = (tabId: number): string => `nav:ledger:${tabId}`

export const enforceMaxLength = (trace: NavigationHop[]): NavigationHop[] => {
  if (trace.length > MAX_TRACE_LENGTH) {
    return trace.slice(-MAX_TRACE_LENGTH)
  }
  return trace
}

export const persist = async (tabId: number, trace: NavigationHop[]): Promise<void> => {
  try {
    const currentUrl = trace[trace.length - 1]?.url || ''
    const ledger: NavigationLedger = { tabId, currentUrl, trace }
    await chrome.storage.session.set({ [STORAGE_KEY(tabId)]: ledger })
  } catch (e) {
    console.error('[navigation-ledger] Failed to persist:', e)
  }
}
