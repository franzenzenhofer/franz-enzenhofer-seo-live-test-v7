import { Logger, type LogCategory, type LogData } from '@/shared/logger'

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
  const htmlSize = html.length
  const navTiming = collectNavTiming()
  Logger.logDirectSend(tabId, 'dom', 'capture done', {
    event,
    htmlSize,
    html: html.slice(0, 500),
    htmlFull: html,
    url: location.href,
    readyState: document.readyState,
    navTiming: navTiming || undefined,
  })
  const data = { html, location, navTiming }
  chrome.runtime.sendMessage({ event, data })
  Logger.logDirectSend(tabId, 'dom', 'send', { event, to: 'background', size: htmlSize })
}

export const initDomCapture = (tabIdPromise: Promise<number>, getTabId: () => number | null) => {
  document.addEventListener('DOMContentLoaded', () => {
    logLater(tabIdPromise, getTabId, 'content', 'fire', { event: 'DOMContentLoaded' })
    captureAndSend(tabIdPromise, getTabId, 'DOMContentLoaded').catch(() => {})
  })
  window.addEventListener('load', () => {
    logLater(tabIdPromise, getTabId, 'content', 'fire', { event: 'load' })
    captureAndSend(tabIdPromise, getTabId, 'load').catch(() => {})
  })
  captureAndSend(tabIdPromise, getTabId, 'document_end').catch(() => {})
  captureAndSend(tabIdPromise, getTabId, 'document_idle').catch(() => {})
}
