import { setRun } from './storeCore'
import type { EventRec, Run } from './types'

/**
 * Which document a subresource callback belongs to. Chrome sets webRequest
 * `documentId` to "the UUID of the document making the request", so a request
 * from an iframe carries the IFRAME's document, never the page's; iframe
 * membership is read from frameId / parentFrameId / parentDocumentId instead.
 * https://developer.chrome.com/docs/extensions/reference/api/webRequest
 * - 'page': a main-frame (frameId 0) request of the run's document, or one
 *   carrying no document identity at all (unchanged behaviour).
 * - 'frame': a subframe request whose parent chain leads to the run's document.
 * - 'foreign': a superseded document, a prerendered or fenced page, or ANY
 *   identified request before nav:commit - until the new document commits,
 *   only the outgoing document can still be making requests.
 */
export type ResourceScope = 'page' | 'frame' | 'foreign'
export const MAX_TRACKED_FRAMES = 64
const MAIN_FRAME_ID = 0

export const resourceScope = (run: Run, ev: EventRec): ResourceScope => {
  if (!ev.documentId && !ev.parentDocumentId) return 'page'
  if (!run.documentId) return 'foreign'
  if (!ev.frameId) return ev.documentId === run.documentId ? 'page' : 'foreign'
  const childOfPage = ev.parentFrameId === MAIN_FRAME_ID && ev.parentDocumentId === run.documentId
  const childOfFrame = ev.parentFrameId !== undefined && (run.frames || []).includes(ev.parentFrameId)
  return childOfPage || childOfFrame ? 'frame' : 'foreign'
}

// Frame IDs are unique within a tab, so a nested iframe is attributed through
// its parent frame. The list is bounded: past the cap, deeper nesting under an
// untracked frame is dropped exactly as all iframe traffic was before.
export const rememberFrame = async (tabId: number, run: Run, frameId: number | undefined) => {
  const frames = run.frames || []
  if (frameId === undefined || frames.includes(frameId) || frames.length >= MAX_TRACKED_FRAMES) return
  await setRun(tabId, { ...run, frames: [...frames, frameId] })
}
