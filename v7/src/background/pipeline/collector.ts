import { runRulesOn } from '../rules/runner'

import { addEvent, popRun, setDomDone } from './store'
import { scheduleFinalize, onAlarm } from './alarms'

import { log } from '@/shared/logs'
import { Logger } from '@/shared/logger'

export const pushEvent = async (tabId: number, ev: import('./types').EventRec) => {
  await Logger.logDirect(tabId, 'event', 'receive', { type: ev.t, url: ev.u || 'no-url', hasData: !!ev.d, status: ev.s })
  await addEvent(tabId, ev)
  await Logger.logDirect(tabId, 'event', 'add', { type: ev.t, tabId })
  if (ev.t.startsWith('dom:')) {
    const data = ev.d as { html?: string } | undefined
    const html = typeof data?.html === 'string' ? data.html : ''
    const len = html.length
    log(tabId, `${ev.t} html=${len}`).catch(() => {})
    await Logger.logDirect(tabId, 'dom', 'event', { type: ev.t, htmlSize: len, html: html.slice(0, 500), htmlFull: html, url: ev.u || 'no-url' })
  }
  if (ev.t === 'nav:before') {
    const { 'ui:autoClear': auto } = await chrome.storage.local.get('ui:autoClear')
    log(tabId, `nav:before url=${ev.u || ''} autoClear=${auto !== false}`).catch(() => {})
    await Logger.logDirect(tabId, 'nav', 'before', { url: ev.u || 'no-url', autoClear: auto !== false })
    if (auto !== false) {
      await chrome.storage.local.remove(`results:${tabId}`)
      await Logger.logDirect(tabId, 'event', 'clear results', { reason: 'autoClear' })
    }
    const { 'ui:preserveLog': keep } = await chrome.storage.local.get('ui:preserveLog')
    if (keep !== true) {
      await chrome.storage.session.remove(`logs:${tabId}`)
      await Logger.logDirect(tabId, 'event', 'clear logs', { reason: 'nav:before preserveLog=false' })
    }
    return
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
  await Logger.logDirect(tabId, 'alarm', 'execute', { runId: run.id, events: run.ev.length, domDone: run.domDone })
  await runRulesOn(tabId, run)
})
