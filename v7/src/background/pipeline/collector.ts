import { runRulesOn } from '../rules/runner'
import { determineTrigger } from '../rules/triggerDetect'
import { abortSession } from '../rules/sessions'

import { addEvent, popRun, resetRun, setDomDone } from './store'
import { scheduleFinalize, clearFinalize, onAlarm } from './alarms'
import { hasNavAfterDom } from './runGuards'

import { log, logSystem, isValidTabId } from '@/shared/logs'
import { Logger } from '@/shared/logger'

export const pushEvent = async (tabId: number, ev: import('./types').EventRec) => {
  if (!isValidTabId(tabId)) {
    await logSystem(`collector:drop tabId=${tabId ?? 'null'} type="${ev.t}"`)
    return
  }
  await Logger.logDirect(tabId, 'event', 'receive', { type: ev.t, url: ev.u || 'no-url', hasData: !!ev.d, status: ev.s })
  if (ev.t === 'nav:before') {
    await clearFinalize(tabId)
    await resetRun(tabId)
    await addEvent(tabId, ev)
    await Logger.logDirect(tabId, 'event', 'add', { type: ev.t, tabId })
    const { 'ui:autoClear': auto } = await chrome.storage.local.get('ui:autoClear')
    log(tabId, `nav:before url=${ev.u || ''} autoClear=${auto !== false}`).catch((err) => console.error('[collector] log failed', err))
    await Logger.logDirect(tabId, 'nav', 'before', { url: ev.u || 'no-url', autoClear: auto !== false })
    if (auto !== false) {
      await chrome.storage.local.remove(`results:${tabId}`)
      await Logger.logDirect(tabId, 'event', 'clear results', { reason: 'autoClear' })
    }
    await abortSession(tabId, 'navigation')
    return
  }
  await addEvent(tabId, ev)
  await Logger.logDirect(tabId, 'event', 'add', { type: ev.t, tabId })
  if (ev.t.startsWith('dom:')) {
    const data = ev.d as { html?: string } | undefined
    const html = typeof data?.html === 'string' ? data.html : ''
    const len = html.length
    log(tabId, `${ev.t} html=${len}`).catch((err) => console.error('[collector] log failed', err))
    await Logger.logDirect(tabId, 'dom', 'event', { type: ev.t, htmlSize: len, html: html.slice(0, 500), htmlFull: html, url: ev.u || 'no-url' })
  }
  if (ev.t === 'dom:document_idle') {
    await Logger.logDirect(tabId, 'event', 'schedule finalize', { reason: 'dom:document_idle', delay: '200ms' })
    await scheduleFinalize(tabId, 200)
  }
}

export const markDomPhase = async (tabId: number) => {
  await Logger.logDirect(tabId, 'event', 'mark dom done', { tabId })
  await setDomDone(tabId)
  await Logger.logDirect(tabId, 'event', 'schedule finalize', { reason: 'markDomPhase', delay: '200ms' })
  await scheduleFinalize(tabId, 200)
}

onAlarm(async (tabId) => {
  await Logger.logDirect(tabId, 'alarm', 'fire', { tabId })
  const run = await popRun(tabId)
  if (!run) {
    await Logger.logDirect(tabId, 'alarm', 'no run', { reason: 'popRun returned null' })
    return
  }
  if (hasNavAfterDom(run)) {
    await Logger.logDirect(tabId, 'alarm', 'skip', { reason: 'nav-after-dom', events: run.ev.length })
    return
  }
  const trigger = determineTrigger(run.ev)
  await Logger.logDirect(tabId, 'alarm', 'execute', {
    runId: run.id,
    events: run.ev.length,
    domDone: run.domDone,
    triggeredBy: trigger,
  })
  await runRulesOn(tabId, run)
})
