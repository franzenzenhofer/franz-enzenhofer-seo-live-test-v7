import { PageInfo, type PageInfoT } from '@/shared/schemas'
import { extractPageInfo } from '@/shared/extract'
import { Logger, type LogCategory, type LogData } from '@/shared/logger'

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

const q = (sel: string) => document.querySelector(sel)

/**
 * DRY abstraction: Log after tabId is ready
 */
const logWhenReady = (category: LogCategory, action: string, data?: LogData): void => {
  tabIdPromise.then(() => {
    Logger.logDirectSend(contentTabId, category, action, data)
  }).catch(() => {})
}

/**
 * Capture DOM and send to background with logging
 * BULLETPROOF: Always waits for tabId to be ready
 */
const captureAndSend = async (event: string): Promise<void> => {
  // ALWAYS wait for tabId - this makes it bulletproof
  await tabIdPromise

  Logger.logDirectSend(contentTabId, 'dom', 'capture start', { event, url: location.href })

  const html = q('html')?.innerHTML || ''
  const htmlSize = html.length

  Logger.logDirectSend(contentTabId, 'dom', 'capture done', {
    event,
    htmlSize,
    html: html.slice(0, 500),
    htmlFull: html,
    url: location.href,
    readyState: document.readyState,
  })

  const data = { html, location }
  chrome.runtime.sendMessage({ event, data })

  Logger.logDirectSend(contentTabId, 'dom', 'send', { event, to: 'background', size: htmlSize })
}

// Register event listeners - captureAndSend handles tabId internally
document.addEventListener('DOMContentLoaded', () => {
  logWhenReady('content', 'fire', { event: 'DOMContentLoaded' })
  captureAndSend('DOMContentLoaded').catch(() => {})
})

window.addEventListener('load', () => {
  logWhenReady('content', 'fire', { event: 'load' })
  captureAndSend('load').catch(() => {})
})

// Immediate captures - captureAndSend handles tabId internally
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
