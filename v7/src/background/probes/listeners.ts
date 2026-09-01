import { claimProbe, finishProbe, probeByRequestId, probeCount } from './state'

// tabId -1 restricts observation to the extension's own contexts (the
// offscreen document issues every probe fetch), never a tab's traffic.
const FILTER: chrome.webRequest.RequestFilter = { urls: ['http://*/*', 'https://*/*'], tabId: -1 }
// Chrome itself stops following after 20 redirects; this only bounds storage.
const MAX_OBSERVED_HOPS = 25

const onBeforeRequest = (e: chrome.webRequest.WebRequestBodyDetails): void => {
  // Redirect targets re-fire onBeforeRequest with the same requestId - only
  // an unseen requestId may claim a probe.
  if (probeByRequestId(e.requestId)) return
  claimProbe(e.url, e.requestId)
}

const onBeforeRedirect = (e: chrome.webRequest.WebRedirectionResponseDetails): void => {
  const record = probeByRequestId(e.requestId)
  if (!record || record.done || record.hops.length >= MAX_OBSERVED_HOPS) return
  record.hops.push({ url: e.url, status: e.statusCode, location: e.redirectUrl })
}

const onCompleted = (e: chrome.webRequest.WebResponseCacheDetails): void => {
  const record = probeByRequestId(e.requestId)
  if (!record || record.done) return
  record.hops.push({ url: e.url, status: e.statusCode })
  finishProbe(record)
}

const onErrorOccurred = (e: chrome.webRequest.WebResponseErrorDetails): void => {
  const record = probeByRequestId(e.requestId)
  if (!record) return
  finishProbe(record)
}

let registered = false

/**
 * Registers the four webRequest listeners while at least one probe is active
 * and removes them when the last probe stops - probes share this one set, so
 * no listener is ever leaked per rule run.
 */
export const syncProbeListeners = (): void => {
  const wanted = probeCount() > 0
  if (wanted === registered) return
  registered = wanted
  if (wanted) {
    chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, FILTER)
    chrome.webRequest.onBeforeRedirect.addListener(onBeforeRedirect, FILTER)
    chrome.webRequest.onCompleted.addListener(onCompleted, FILTER)
    chrome.webRequest.onErrorOccurred.addListener(onErrorOccurred, FILTER)
    return
  }
  chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequest)
  chrome.webRequest.onBeforeRedirect.removeListener(onBeforeRedirect)
  chrome.webRequest.onCompleted.removeListener(onCompleted)
  chrome.webRequest.onErrorOccurred.removeListener(onErrorOccurred)
}

export const probeListenersRegistered = (): boolean => registered
