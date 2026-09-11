/**
 * A soft navigation changes the URL of the document that is already loaded:
 * history.pushState / replaceState, or a same-document back/forward move.
 * Chrome reports it as webNavigation.onHistoryStateUpdated ("Fired when the
 * frame's history was updated to a new URL", "can fire any time after
 * onDOMContentLoaded"); a change of the fragment alone is a separate event,
 * onReferenceFragmentUpdated, that never reaches the pipeline - the same
 * resource stays displayed, so a fragment is ignored in every URL comparison.
 * https://developer.chrome.com/docs/extensions/reference/api/webNavigation#event-onHistoryStateUpdated
 * https://developer.chrome.com/docs/extensions/reference/api/webNavigation#event-onReferenceFragmentUpdated
 * No new document is created, so no content script is injected and no
 * main-frame HTTP response exists for the new URL.
 */
export const RECAPTURE_MESSAGE = 'audit:recapture'

export type RecaptureMessage = { type: typeof RECAPTURE_MESSAGE; url: string }

export const stripFragment = (url: string): string => {
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    return parsed.href
  } catch {
    return url.replace(/#.*$/, '')
  }
}

/** Equal URLs once the fragment is dropped; false when either side is missing. */
export const sameDocumentUrl = (a: string | undefined, b: string | undefined): boolean =>
  !!a && !!b && stripFragment(a) === stripFragment(b)

/** A run whose events hold a history update but no document commit came from a soft navigation. */
export const observedSoftNavigation = (events: Array<{ t?: string } | null | undefined>): boolean =>
  events.some((event) => event?.t === 'nav:history') && !events.some((event) => event?.t === 'nav:commit')

export const isRecaptureMessage = (msg: unknown): msg is RecaptureMessage => {
  const payload = msg as { type?: unknown; url?: unknown } | null | undefined
  return payload?.type === RECAPTURE_MESSAGE && typeof payload.url === 'string'
}
