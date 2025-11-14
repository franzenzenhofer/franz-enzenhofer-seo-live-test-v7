import { PageInfo, type PageInfoT } from '@/shared/schemas'
import { extractPageInfo } from '@/shared/extract'
import { Logger } from '@/shared/logger'

// Set context for logging
Logger.setContext('content')

// Initialize tabId for logging
chrome.runtime.sendMessage('tabIdPls', (response) => {
  if (response?.tabId) {
    Logger.setTabId(response.tabId)
  }
})

const q = (sel: string) => document.querySelector(sel)

/**
 * Capture DOM and send to background with logging
 */
const captureAndSend = (event: string): void => {
  Logger.logSync('dom', 'capture start', { event, url: location.href })

  const html = q('html')?.innerHTML || ''
  const htmlSize = html.length

  Logger.logSync('dom', 'capture done', {
    event,
    htmlSize,
    html: html.slice(0, 500),
    htmlFull: html,
    url: location.href,
    readyState: document.readyState,
  })

  const data = { html, location }
  chrome.runtime.sendMessage({ event, data })

  Logger.logSync('dom', 'send', { event, to: 'background', size: htmlSize })
}

// Log content script injection
Logger.logSync('content', 'inject', { url: location.href, readyState: document.readyState })

// Register event listeners with logging
Logger.logSync('content', 'listen', { event: 'DOMContentLoaded' })
document.addEventListener('DOMContentLoaded', () => {
  Logger.logSync('content', 'fire', { event: 'DOMContentLoaded' })
  captureAndSend('DOMContentLoaded')
})

Logger.logSync('content', 'listen', { event: 'load' })
window.addEventListener('load', () => {
  Logger.logSync('content', 'fire', { event: 'load' })
  captureAndSend('load')
})

// Immediate captures
captureAndSend('document_end')
captureAndSend('document_idle')

chrome.runtime.onMessage.addListener((msg, _s, reply) => {
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
