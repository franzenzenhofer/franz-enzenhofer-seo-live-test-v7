import { NavigationHop, NavigationLedger } from './types'

const traces = new Map<number, NavigationHop[]>()
const STORAGE_KEY = (tabId: number) => `nav:ledger:${tabId}`

const persist = async (tabId: number, trace: NavigationHop[]): Promise<void> => {
  const currentUrl = trace[trace.length - 1]?.url || ''
  const ledger: NavigationLedger = { tabId, currentUrl, trace }
  await chrome.storage.session.set({ [STORAGE_KEY(tabId)]: ledger })
}

export const registerHistoryListeners = (): void => {
  chrome.webRequest.onBeforeRedirect.addListener(
    (d) => {
      if (d.type !== 'main_frame') return
      const trace = traces.get(d.tabId) || []

      trace.push({
        url: d.url,
        timestamp: Date.now(),
        type: 'http_redirect',
        statusCode: d.statusCode,
        statusText: d.statusLine,
      })

      traces.set(d.tabId, trace)
    },
    { urls: ['<all_urls>'] },
  )

  chrome.webNavigation.onCommitted.addListener(async (d) => {
    if (d.frameId !== 0) return

    let trace = traces.get(d.tabId) || []
    const isRedirect =
      d.transitionQualifiers.includes('client_redirect') ||
      d.transitionQualifiers.includes('server_redirect')

    if (!isRedirect && d.transitionType !== 'reload') {
      const lastHop = trace[trace.length - 1]
      if (lastHop && lastHop.type !== 'http_redirect') {
        trace = []
      }
    }

    const hopType = d.transitionQualifiers.includes('client_redirect')
      ? 'client_redirect'
      : 'load'

    trace.push({
      url: d.url,
      timestamp: Date.now(),
      type: hopType,
      statusCode: 200,
      transitionType: d.transitionType,
      transitionQualifiers: d.transitionQualifiers,
    })

    traces.set(d.tabId, trace)
    await persist(d.tabId, trace)
  })

  chrome.webNavigation.onHistoryStateUpdated.addListener(async (d) => {
    if (d.frameId !== 0) return
    const trace = traces.get(d.tabId) || []

    trace.push({
      url: d.url,
      timestamp: Date.now(),
      type: 'history_api',
      statusCode: 200,
      transitionType: d.transitionType,
    })

    traces.set(d.tabId, trace)
    await persist(d.tabId, trace)
  })
}

export const getLedger = async (tabId: number): Promise<NavigationLedger | null> => {
  const k = STORAGE_KEY(tabId)
  const res = await chrome.storage.session.get(k)
  return (res[k] as NavigationLedger) || null
}
