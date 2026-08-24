import { handleHighlightMessage } from './highlight'
import { captureDomPhase } from './domCapture'
import { contentTabId, getContentTabId } from './tabContext'

import { PageInfo, type PageInfoT } from '@/shared/schemas'
import { extractPageInfo } from '@/shared/extract'
import { Logger } from '@/shared/logger'
import { installCrashNet } from '@/shared/crashNet'

// Set context for logging
Logger.setContext('content')
installCrashNet('content')

captureDomPhase('document_idle', contentTabId, getContentTabId).catch(() => {})

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
