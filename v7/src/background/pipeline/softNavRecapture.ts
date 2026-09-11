import { Logger } from '@/shared/logger'
import { RECAPTURE_MESSAGE, sameDocumentUrl, type RecaptureMessage } from '@/shared/softNavigation'

export type RecaptureRequest = { url: string; documentId?: string; manual: boolean }

/**
 * Debounce per tab: a search box that pushes a URL per keystroke yields ONE
 * capture, for the last URL, no later than SOFT_NAV_MAX_DEFER_MS after the
 * first change. The timer lives in the service worker on purpose: chrome.alarms
 * cannot fire under 30 s in a packed build, and the worker stays alive for
 * 30 s after the webNavigation event that queued this, far beyond the bound.
 */
export const SOFT_NAV_DEBOUNCE_MS = 750
export const SOFT_NAV_MAX_DEFER_MS = 4_000

type Pending = { request: RecaptureRequest; firstAt: number; timer: ReturnType<typeof setTimeout> }
const pending = new Map<number, Pending>()

export const requestRecapture = (tabId: number, request: RecaptureRequest, now = Date.now()): void => {
  const previous = pending.get(tabId)
  if (previous) clearTimeout(previous.timer)
  const firstAt = previous?.firstAt ?? now
  const delay = Math.max(0, Math.min(SOFT_NAV_DEBOUNCE_MS, firstAt + SOFT_NAV_MAX_DEFER_MS - now))
  const timer = setTimeout(() => {
    pending.delete(tabId)
    dispatchRecapture(tabId, request).catch((error) => console.error('[soft-nav] recapture failed', error))
  }, delay)
  pending.set(tabId, { request, firstAt, timer })
}

/** A real navigation, a Run test click or a closed tab makes a pending capture pointless. */
export const cancelRecapture = (tabId: number): void => {
  const entry = pending.get(tabId)
  if (!entry) return
  clearTimeout(entry.timer)
  pending.delete(tabId)
}

// The frame must still show the requested URL in the requested document; a
// newer history update or a real navigation has its own handling.
const frameStillShows = async (tabId: number, request: RecaptureRequest): Promise<boolean> => {
  const frame = await chrome.webNavigation.getFrame({ tabId, frameId: 0 })
  if (!frame || !sameDocumentUrl(frame.url, request.url)) return false
  return !request.documentId || frame.documentId === request.documentId
}

/**
 * Asks the content script that already lives in the document to capture the
 * new route. `documentId` (Chrome 106+) delivers the message to that document
 * only - "Send a message to a specific document identified by documentId
 * instead of all frames in the tab":
 * https://developer.chrome.com/docs/extensions/reference/api/tabs#method-sendMessage
 */
export const dispatchRecapture = async (tabId: number, request: RecaptureRequest): Promise<boolean> => {
  if (!await frameStillShows(tabId, request)) {
    await Logger.logDirect(tabId, 'nav', 'recapture skipped', { reason: 'frame moved on', url: request.url })
    return false
  }
  const message: RecaptureMessage = { type: RECAPTURE_MESSAGE, url: request.url }
  const options: chrome.tabs.MessageSendOptions = { frameId: 0 }
  if (request.documentId) options.documentId = request.documentId
  try {
    const reply = await chrome.tabs.sendMessage(tabId, message, options) as { ok?: boolean } | undefined
    const accepted = reply?.ok === true
    await Logger.logDirect(tabId, 'nav', 'recapture requested', { url: request.url, accepted, manual: request.manual })
    return accepted
  } catch (error) {
    // No content script answers (document gone, page refuses scripts): visible in the tab log.
    await Logger.logDirect(tabId, 'nav', 'recapture unreachable', { url: request.url, error: error instanceof Error ? error.message : String(error) })
    return false
  }
}
