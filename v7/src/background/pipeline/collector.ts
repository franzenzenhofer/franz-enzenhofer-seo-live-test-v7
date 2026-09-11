import { clearTabSessionState } from '../tabCleanup'

import { addEvent, peekRun, setDomDone } from './store'
import { scheduleFinalize, onAlarm } from './alarms'
import { finalizeTab } from './finalize'
import { bindManualRun } from './manualRun'

import { log, logSystem, isValidTabId } from '@/shared/logs'
import { Logger } from '@/shared/logger'

const collectionQueues = new Map<number, Promise<void>>()
export const flushCollection = (tabId: number) => collectionQueues.get(tabId) || Promise.resolve()

/**
 * Resolves whether the store accepted the event. A drop is an expected outcome,
 * not a failure: the store discards stale traffic by design (no run for the tab
 * after finalize/cleanup, a superseded document, the previous page's aborted
 * requests). Only real failures (storage errors) reject.
 */
const collectEvent = async (tabId: number, ev: import('./types').EventRec): Promise<boolean> => {
  if (!isValidTabId(tabId)) {
    await logSystem(`collector:drop tabId=${tabId ?? 'null'} type="${ev.t}"`)
    return false
  }
  await Logger.logDirect(tabId, 'event', 'receive', { type: ev.t, url: ev.u || 'no-url', hasData: !!ev.d, status: ev.s })
  if (ev.t === 'nav:before') {
    await clearTabSessionState(tabId, 'navigation')
    await addEvent(tabId, ev)
    await Logger.logDirect(tabId, 'event', 'add', { type: ev.t, tabId })
    const { 'ui:autoClear': auto } = await chrome.storage.local.get('ui:autoClear')
    log(tabId, `nav:before url=${ev.u || ''} autoClear=${auto !== false}`).catch((err) => console.error('[collector] log failed', err))
    await Logger.logDirect(tabId, 'nav', 'before', { url: ev.u || 'no-url', autoClear: auto !== false })
    if (auto !== false) {
      await chrome.storage.local.remove(`results:${tabId}`)
      await Logger.logDirect(tabId, 'event', 'clear results', { reason: 'autoClear' })
    }
    return true
  }
  if (!await addEvent(tabId, ev)) {
    // Tab log, not the system log: its 200-entry ring would be flooded by webRequest bursts.
    await Logger.logDirect(tabId, 'event', 'drop', { type: ev.t, url: ev.u || 'no-url', documentId: ev.documentId ?? 'none' })
    return false
  }
  await Logger.logDirect(tabId, 'event', 'add', { type: ev.t, tabId })
  if (ev.t === 'nav:commit' && ev.documentId) await bindManualRun(tabId, ev.documentId)
  if (ev.t === 'dom:document_end') await finalizeIfIdleAlreadyDone(tabId)
  if (ev.t.startsWith('dom:')) {
    const data = ev.d as { facts?: { nodeCount?: number }; results?: unknown[] } | undefined
    const nodes = data?.facts?.nodeCount || 0
    log(tabId, `${ev.t} nodes=${nodes}`).catch((err) => console.error('[collector] log failed', err))
    await Logger.logDirect(tabId, 'dom', 'event', { type: ev.t, nodes, results: data?.results?.length || 0, url: ev.u || 'no-url' })
  }
  return true
}

export const pushEvent = (tabId: number, ev: import('./types').EventRec): Promise<boolean> => {
  const task = flushCollection(tabId).then(() => collectEvent(tabId, ev))
  collectionQueues.set(tabId, task.then(() => undefined, () => undefined))
  return task
}

// The static phase runs its rules in the content script and can still be busy
// when idle reports. Waiting for it beats finalizing without its results; the
// watchdog keeps a static phase that never arrives from stalling the run.
const FINALIZE_DELAY_MS = 200
const STATIC_PHASE_GRACE_MS = 8_000

const finalizeIfIdleAlreadyDone = async (tabId: number) => {
  const run = await peekRun(tabId)
  if (!run?.domDone) return
  await Logger.logDirect(tabId, 'event', 'schedule finalize', { reason: 'static-phase-landed', delay: `${FINALIZE_DELAY_MS}ms` })
  await scheduleFinalize(tabId, FINALIZE_DELAY_MS)
}

export const markDomPhase = async (tabId: number, documentId?: string) => {
  await Logger.logDirect(tabId, 'event', 'mark dom done', { tabId })
  const state = await setDomDone(tabId, documentId)
  if (state === 'stale') {
    await logSystem(`collector:stale-idle tabId=${tabId} documentId=${documentId ?? 'none'}`)
    return state
  }
  const delay = state === 'ready' ? FINALIZE_DELAY_MS : STATIC_PHASE_GRACE_MS
  await Logger.logDirect(tabId, 'event', 'schedule finalize', { reason: `markDomPhase:${state}`, delay: `${delay}ms` })
  await scheduleFinalize(tabId, delay)
  return state
}

onAlarm((tabId) => finalizeTab(tabId).catch((error) => console.error('[collector] finalize failed', error)))
