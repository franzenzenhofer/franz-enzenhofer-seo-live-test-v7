import { pushEvent } from '../pipeline/collector'

import { normalizeResponseHeaders, indexingHeaderFields } from '@/shared/responseHeaders'

// Chrome exposes documentId / parentDocumentId on webRequest details since Chrome 106;
// @types/chrome does not declare them yet.
const optionalId = (details: object, key: 'documentId' | 'parentDocumentId'): string | undefined => {
  const value = (details as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}
// Which frame and document made the request: the store attributes iframe traffic by it.
const frameIdentity = (details: { frameId: number; parentFrameId: number }) => ({
  frameId: details.frameId, parentFrameId: details.parentFrameId,
  documentId: optionalId(details, 'documentId'), parentDocumentId: optionalId(details, 'parentDocumentId'),
})

export const registerRequestListeners = () => {
  const f = { urls: ['http://*/*', 'https://*/*'] }
  chrome.webRequest.onBeforeSendHeaders.addListener((e) => {
    pushEvent(e.tabId, { t: e.type === 'main_frame' ? 'req:mainBeforeHeaders' : 'req:beforeHeaders', u: e.url, requestId: e.requestId, resourceType: e.type, ...frameIdentity(e) })
  }, f, ['requestHeaders'])
  chrome.webRequest.onHeadersReceived.addListener((e) => {
    const fields: Array<[string, string]> = (e.responseHeaders || []).map((x) => [x.name, x.value || ''])
    const h = normalizeResponseHeaders(fields)
    const isMain = e.type === 'main_frame'
    pushEvent(e.tabId, {
      t: isMain ? 'req:mainHeaders' : 'req:headers',
      u: e.url,
      requestId: e.requestId, resourceType: e.type, ...frameIdentity(e),
      h,
      headerFields: indexingHeaderFields(fields),
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
      requestId: e.requestId, resourceType: e.type, ...frameIdentity(e),
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
      requestId: e.requestId, resourceType: e.type, ...frameIdentity(e),
      s: e.statusCode,
      c: e.fromCache,
      sl: e.statusLine,
      ip: (e as { ip?: string }).ip,
    })
  }, f)
  chrome.webRequest.onErrorOccurred.addListener((e) => {
    pushEvent(e.tabId, {
      t: e.type === 'main_frame' ? 'req:mainError' : 'req:error', u: e.url,
      requestId: e.requestId, resourceType: e.type, ...frameIdentity(e), error: e.error,
    }).catch((error) => console.error('[requests] capture failed', error))
  }, f)

}
