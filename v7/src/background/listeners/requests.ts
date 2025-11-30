import { pushEvent } from '../pipeline/collector'

export const registerRequestListeners = () => {
  const f = { urls: ['http://*/*', 'https://*/*'] }
  chrome.webRequest.onBeforeSendHeaders.addListener((e) => {
    pushEvent(e.tabId, { t: 'req:beforeHeaders', u: e.url })
  }, f, ['requestHeaders'])
  chrome.webRequest.onHeadersReceived.addListener((e) => {
    const h = Object.fromEntries((e.responseHeaders || []).map((x) => [x.name, x.value]))
    const isMain = e.type === 'main_frame'
    pushEvent(e.tabId, {
      t: isMain ? 'req:mainHeaders' : 'req:headers',
      u: e.url,
      h,
      sc: e.statusCode,
      sl: e.statusLine,
      ip: (e as { ip?: string }).ip,
    })
  }, f, ['responseHeaders'])
  chrome.webRequest.onBeforeRedirect.addListener((e) => {
    const isMain = e.type === 'main_frame'
    pushEvent(e.tabId, {
      t: isMain ? 'req:mainRedirect' : 'req:redirect',
      u: e.url,
      ru: e.redirectUrl,
      sc: e.statusCode,
      sl: e.statusLine,
      ip: (e as { ip?: string }).ip,
    })
  }, f)
  chrome.webRequest.onCompleted.addListener((e) => {
    const isMain = e.type === 'main_frame'
    pushEvent(e.tabId, {
      t: isMain ? 'req:mainDone' : 'req:done',
      u: e.url,
      s: e.statusCode,
      c: e.fromCache,
      sl: e.statusLine,
      ip: (e as { ip?: string }).ip,
    })
  }, f)
}
