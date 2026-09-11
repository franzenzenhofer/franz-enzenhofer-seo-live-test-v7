import { clearFinalize, scheduleFinalize } from './alarms'
import { MANUAL_RUN_WATCHDOG_MS } from './manualRun'
import { requestRecapture } from './softNavRecapture'
import { addEvent, peekRun, resetRun, startSoftNavRun } from './store'
import type { EventRec, Run } from './types'

import { Logger } from '@/shared/logger'
import { readRunMeta } from '@/shared/runMeta'
import { sameDocumentUrl } from '@/shared/softNavigation'

export type HistoryUpdateOutcome = 'same-url' | 'during-load' | 'soft-navigation'

const lastNavUrl = (run: Run | null): string | undefined =>
  run?.ev.filter((event) => event.t.startsWith('nav:') && !!event.u).at(-1)?.u

const hasDomPhase = (run: Run | null): boolean => !!run?.ev.some((event) => event.t.startsWith('dom:'))

/** The page the pipeline currently stands for: the run being collected, else the run the panel shows. */
const representedUrl = async (tabId: number, run: Run | null): Promise<string | undefined> =>
  lastNavUrl(run) ?? (await readRunMeta(tabId))?.url

/**
 * Main-frame history update (pushState / replaceState / same-document
 * back-forward). Three cases:
 * - same URL (fragment ignored): a rewrite of the address, e.g. a framework
 *   storing state on hydration - recorded, nothing else.
 * - a different URL before any DOM phase landed: still the load of this
 *   document (utm stripping, canonicalising); the phases capture location.href.
 * - a different URL once the DOM was captured, or with no run at all: a soft
 *   navigation. The captured DOM belongs to the previous route, so the record
 *   is replaced and - with auto-run on, or for a Run test still in flight -
 *   the document is asked to capture the new route. Auto-run off: no run; the
 *   panel reads the tab URL and marks the shown run as not this page's.
 */
export const collectHistoryUpdate = async (tabId: number, ev: EventRec): Promise<HistoryUpdateOutcome> => {
  const run = await peekRun(tabId)
  const current = await representedUrl(tabId, run)
  if (!ev.u || sameDocumentUrl(current, ev.u)) {
    if (run) await addEvent(tabId, ev)
    return 'same-url'
  }
  // A soft-navigation record that has not captured yet is superseded, not extended.
  if (run && !run.softNav && !hasDomPhase(run)) {
    await addEvent(tabId, ev)
    return 'during-load'
  }
  const manual = run?.manual === true
  const { 'ui:autoRun': autoRun } = await chrome.storage.local.get('ui:autoRun')
  const audited = autoRun !== false || manual
  await clearFinalize(tabId)
  await Logger.logDirect(tabId, 'nav', 'soft navigation', { from: current || 'none', to: ev.u, superseded: !!run, manual, audited })
  if (!audited) {
    await resetRun(tabId)
    return 'soft-navigation'
  }
  await startSoftNavRun(tabId, ev, manual)
  // The Run test watchdog carries over: the user asked for this document's test.
  if (manual) await scheduleFinalize(tabId, MANUAL_RUN_WATCHDOG_MS)
  requestRecapture(tabId, { url: ev.u, documentId: ev.documentId, manual })
  return 'soft-navigation'
}
