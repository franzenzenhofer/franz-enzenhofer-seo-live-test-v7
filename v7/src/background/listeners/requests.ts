import { pushEvent } from '../pipeline/collector'

export const registerRequestListeners = () => {
  const f = { urls: ['http://*/*', 'https://*/*'] }
  chrome.webRequest.onBeforeSendHeaders.addListener((e) => {
    pushEvent(e.tabId, { t: 'req:beforeHeaders', u: e.url })
  }, f, ['requestHeaders'])
  chrome.webRequest.onHeadersReceived.addListener((e) => {
    const h = Object.fromEntries((e.responseHeaders || []).map((x) => [x.name, x.value]))
    pushEvent(e.tabId, { t: 'req:headers', u: e.url, h })
  }, f, ['responseHeaders'])
  chrome.webRequest.onCompleted.addListener((e) => {
    pushEvent(e.tabId, { t: 'req:done', u: e.url, s: e.statusCode })
  }, f)
}

