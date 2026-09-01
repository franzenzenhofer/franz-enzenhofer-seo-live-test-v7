import { runRulesOn } from '../rules/runner'
import { determineTrigger } from '../rules/triggerDetect'

import { peekRun, popRun, resetRun } from './store'
import { scheduleFinalize } from './alarms'
import { hasNavAfterDom } from './runGuards'

import { Logger } from '@/shared/logger'

/**
 * Executes the collected run for a tab. Guards run BEFORE the run is consumed:
 * popping first destroyed the events (including content-script phase results)
 * whenever the tab was inactive at alarm time, losing the run forever.
 */
export const finalizeTab = async (tabId: number) => {
  await Logger.logDirect(tabId, 'alarm', 'fire', { tabId })
  const run = await peekRun(tabId)
  if (!run) {
    await Logger.logDirect(tabId, 'alarm', 'no run', { reason: 'peekRun returned null' })
    return
  }
  if (hasNavAfterDom(run)) {
    await resetRun(tabId)
    await Logger.logDirect(tabId, 'alarm', 'skip', { reason: 'nav-after-dom', events: run.ev.length })
    return
  }
  if (!run.domDone && !run.ev.some((e) => e.t.startsWith('dom:'))) {
    // Events accumulating for the NEXT page (late requests after the previous
    // pop). Executing this would supersede - and thereby abort - the run that
    // is still streaming results. Leave it; document_idle re-arms the finalize.
    await Logger.logDirect(tabId, 'alarm', 'skip-kept', { reason: 'no-dom-phase', events: run.ev.length })
    return
  }
  const trigger = determineTrigger(run.ev)
  const tab = await chrome.tabs.get(tabId).catch(() => null)
  if (!tab?.active) {
    // Keep the run; resumePendingRun re-schedules it when the tab activates.
    await Logger.logDirect(tabId, 'alarm', 'skip-kept', { reason: 'inactive-tab', triggeredBy: trigger })
    return
  }
  const popped = await popRun(tabId)
  if (!popped) {
    await Logger.logDirect(tabId, 'alarm', 'no run', { reason: 'consumed by concurrent finalize' })
    return
  }
  await Logger.logDirect(tabId, 'alarm', 'execute', {
    runId: popped.id,
    events: popped.ev.length,
    domDone: popped.domDone,
    triggeredBy: trigger,
  })
  await runRulesOn(tabId, popped)
}

/** Re-arms the finalize for a run that was kept while its tab was inactive. */
export const resumePendingRun = async (tabId: number) => {
  const run = await peekRun(tabId)
  if (!run?.domDone) return false
  await Logger.logDirect(tabId, 'alarm', 'resume', { reason: 'tab-activated', events: run.ev.length })
  await scheduleFinalize(tabId, 200)
  return true
}
