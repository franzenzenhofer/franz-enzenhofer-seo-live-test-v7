import { getActiveTabId } from '@/shared/chrome'
import { log } from '@/shared/logs'
import { hardRefreshTab } from '@/shared/hardRefresh'
import { clearRunMeta } from '@/shared/runMeta'
import { isAbsoluteUrl, isValidUrl } from '@/shared/url-utils'
import { isRestrictedUrl } from '@/shared/tabMemory'
import { pageSkipMessage, unsafePageReason } from '@/shared/probeSafety'

// A manual run hard-reloads the tab: on an action URL that would repeat the action.
const refuseUnsafePage = (url?: string) => {
  const reason = url ? unsafePageReason(url) : null
  if (reason) throw new Error(pageSkipMessage(reason))
}

const normalizeRunUrl = (raw?: string) => {
  const trimmed = (raw || '').trim()
  if (!trimmed) return undefined
  const candidate = isAbsoluteUrl(trimmed) ? trimmed : `https://${trimmed}`
  if (!isValidUrl(candidate)) {
    throw new Error('Invalid URL. Use a full URL like https://example.com/path')
  }
  if (isRestrictedUrl(candidate)) {
    throw new Error('Restricted URL. Use an http(s) page instead.')
  }
  refuseUnsafePage(candidate)
  return candidate
}

// The background owns the tab's live state (alarms, run record, session);
// it kills it and writes the `starting` meta before the navigation begins.
const startRunInBackground = async (tabId: number, url: string) => {
  const reply = await chrome.runtime.sendMessage({ t: 'panel:run-start', d: { tabId, url } }) as { ok?: boolean; error?: string } | undefined
  if (!reply?.ok) throw new Error(reply?.error || 'Background did not acknowledge the run start')
}

/**
 * Run test: kill everything known about the page, clear its caches, load it
 * ONCE and show the run starting right away (issue #1).
 */
export const executeRunNow = async (url?: string) => {
  const normalizedUrl = normalizeRunUrl(url)
  const tabId = await getActiveTabId()
  if (!tabId) throw new Error('No active tab')
  const tab = await chrome.tabs.get(tabId)
  if (!normalizedUrl) {
    if (isRestrictedUrl(tab.url)) throw new Error('Cannot run on chrome:// pages. Switch to a web page or enter a URL.')
    refuseUnsafePage(tab.url)
  }

  // Mark start of new test run in logs (do not clear logs)
  await log(tabId, '========== NEW TEST RUN STARTED ==========')
  await startRunInBackground(tabId, normalizedUrl || tab.url || '')
  try {
    await hardRefreshTab(tabId, normalizedUrl)
  } catch (error) {
    // No navigation happened, so no run will come: do not leave the panel "starting".
    await clearRunMeta(tabId)
    throw error
  }
  return normalizedUrl
}
