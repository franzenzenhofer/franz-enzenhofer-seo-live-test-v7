import { Logger, type LogCategory, type LogData } from '@/shared/logger'
import { capHtmlForMessageAsync, HTML_CAP_BYTES } from '@/shared/htmlCap'

const q = (sel: string) => document.querySelector(sel)

const collectNavTiming = () => {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (!nav) return null
    return {
      nextHopProtocol: nav.nextHopProtocol || '',
      transferSize: nav.transferSize,
      encodedBodySize: nav.encodedBodySize,
      decodedBodySize: nav.decodedBodySize,
      type: nav.type,
    }
  } catch {
    return null
  }
}

const logLater = (tabIdPromise: Promise<number>, getTabId: () => number | null, category: LogCategory, action: string, data?: LogData) => {
  tabIdPromise.then(() => {
    const tabId = getTabId()
    if (tabId) Logger.logDirectSend(tabId, category, action, data)
  }).catch(() => {})
}

const captureAndSend = async (tabIdPromise: Promise<number>, getTabId: () => number | null, event: string) => {
  await tabIdPromise
  const tabId = getTabId()
  Logger.logDirectSend(tabId, 'dom', 'capture start', { event, url: location.href })
  const html = q('html')?.innerHTML || ''
  // Logs get the capped representation (size + sha256 + head/tail) to honor
  // the MV3 hardening message-size budget. The rules engine reads the full
  // HTML from `data.html`, so we MUST NOT truncate that payload here - rules
  // need to parse the real DOM. The chrome.runtime sendMessage limit applies
  // per-message and the engine's collector buffers the events without
  // forwarding them verbatim, so the full HTML stays local to the SW realm.
  const capped = await capHtmlForMessageAsync(html)
  const navTiming = collectNavTiming()
  Logger.logDirectSend(tabId, 'dom', 'capture done', {
    event,
    htmlSize: capped.size,
    htmlSha256: capped.sha256,
    truncated: capped.truncated,
    snippet: capped.snippet,
    url: location.href,
    readyState: document.readyState,
    navTiming: navTiming || undefined,
  })
  const data = { html, htmlSize: capped.size, htmlSha256: capped.sha256, truncated: capped.truncated, location, navTiming }
  chrome.runtime.sendMessage({ event, data })
  Logger.logDirectSend(tabId, 'dom', 'send', { event, to: 'background', size: capped.size, capped: capped.truncated, cap: HTML_CAP_BYTES })
}

export const initDomCapture = (tabIdPromise: Promise<number>, getTabId: () => number | null) => {
  const ac = new AbortController()
  const { signal } = ac
  document.addEventListener('DOMContentLoaded', () => {
    logLater(tabIdPromise, getTabId, 'content', 'fire', { event: 'DOMContentLoaded' })
    captureAndSend(tabIdPromise, getTabId, 'DOMContentLoaded').catch(() => {})
  }, { once: true, signal })
  window.addEventListener('load', () => {
    logLater(tabIdPromise, getTabId, 'content', 'fire', { event: 'load' })
    captureAndSend(tabIdPromise, getTabId, 'load').catch(() => {})
  }, { once: true, signal })
  window.addEventListener('pagehide', () => ac.abort(), { once: true })
  captureAndSend(tabIdPromise, getTabId, 'document_end').catch(() => {})
  captureAndSend(tabIdPromise, getTabId, 'document_idle').catch(() => {})
}
