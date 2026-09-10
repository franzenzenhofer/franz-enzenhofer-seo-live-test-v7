import { getActiveTabId } from '@/shared/chrome'
import { log } from '@/shared/logs'
import { clearResults } from '@/shared/results'
import { hardRefreshTab } from '@/shared/hardRefresh'
import { clearRunMeta } from '@/shared/runMeta'
import { isAbsoluteUrl, isValidUrl } from '@/shared/url-utils'
import { isRestrictedUrl } from '@/shared/tabMemory'
import { requestManualAudit } from '@/shared/auditIntent'
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

export const executeRunNow = async (url?: string) => {
  const normalizedUrl = normalizeRunUrl(url)
  if (!normalizedUrl) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (isRestrictedUrl(tab?.url)) {
      throw new Error('Cannot run on chrome:// pages. Switch to a web page or enter a URL.')
    }
    refuseUnsafePage(tab?.url)
  }
  const tabId = await getActiveTabId()
  if (!tabId) throw new Error('No active tab')

  // Mark start of new test run in logs (do not clear logs)
  await log(tabId, '========== NEW TEST RUN STARTED ==========')

  await Promise.all([clearResults(tabId), clearRunMeta(tabId)])
  await requestManualAudit(tabId)

  // Hard refresh will trigger DOM capture and rule execution automatically
  await hardRefreshTab(tabId, normalizedUrl)
  return normalizedUrl
}
