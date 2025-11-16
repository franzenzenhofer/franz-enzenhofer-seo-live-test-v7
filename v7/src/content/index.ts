import { handleHighlightMessage } from './highlight'
import { initDomCapture } from './domCapture'

import { PageInfo, type PageInfoT } from '@/shared/schemas'
import { extractPageInfo } from '@/shared/extract'
import { Logger } from '@/shared/logger'

// Set context for logging
Logger.setContext('content')

// Get tabId for logging - MUST be initialized before any logging
let contentTabId: number | null = null
const tabIdPromise = new Promise<number>((resolve) => {
  chrome.runtime.sendMessage('tabIdPls', (response) => {
    if (response?.tabId) {
      contentTabId = response.tabId
      resolve(response.tabId)
    } else {
      throw new Error('Failed to get tabId from background')
    }
  })
})

initDomCapture(tabIdPromise, () => contentTabId)

chrome.runtime.onMessage.addListener((msg, _s, reply) => {
  if (handleHighlightMessage(msg, reply)) return true
  if (msg?.type !== 'getPageInfo') return
  const data = PageInfo.parse(extractPageInfo())
  reply(data satisfies PageInfoT)
  return true
})

// Expose sidepanel URL only in Dev builds for E2E; avoid CSP violations in production pages.
try {
  const m = chrome.runtime.getManifest()
  const vn = (m as unknown as { version_name?: string }).version_name || ''
  if (m?.name?.includes('(Dev)') || vn.includes('dev')) {
    const u = chrome.runtime.getURL('src/sidepanel.html')
    const s = document.createElement('script')
    s.textContent = `window.__LT_SIDEPANEL_URL__=${JSON.stringify(u)}`
    const parent = document.documentElement || document.head || document.body
    if (parent) parent.appendChild(s)
    s.remove()
    try {
      document.documentElement?.setAttribute('data-lt-sidepanel-url', u)
    } catch {
      // ignore
    }
  }
} catch { /* ignore */ }
