import { Logger } from '@/shared/logger'

const url = 'src/offscreen.html'

const hasOffscreenSupport = () => Boolean(chrome.offscreen?.createDocument)

let creating: Promise<void> | null = null

const createDocument = async (tabId: number): Promise<void> => {
  await Logger.logDirect(tabId, 'offscreen', 'create doc', { url })
  await chrome.offscreen.createDocument({
    url,
    reasons: [chrome.offscreen.Reason.DOM_PARSER],
    justification: 'Run rules asynchronously in isolated doc',
  })
  await Logger.logDirect(tabId, 'offscreen', 'doc created', {})
}

/**
 * "An installed extension can only have one open at a time." Two tabs
 * finalizing concurrently both observe hasDocument() === false; the second
 * createDocument would reject with "Only a single offscreen document may be
 * created" and fail that tab's run. Concurrent callers share one creation.
 * https://developer.chrome.com/docs/extensions/reference/api/offscreen
 */
export const ensureOffscreenDocument = async (tabId: number): Promise<boolean> => {
  if (!hasOffscreenSupport()) {
    await Logger.logDirect(tabId, 'offscreen', 'no API support', {})
    return false
  }
  if (await chrome.offscreen.hasDocument()) {
    await Logger.logDirect(tabId, 'offscreen', 'doc exists', {})
    return true
  }
  if (!creating) {
    creating = createDocument(tabId).finally(() => {
      creating = null
    })
  }
  await creating
  return true
}
