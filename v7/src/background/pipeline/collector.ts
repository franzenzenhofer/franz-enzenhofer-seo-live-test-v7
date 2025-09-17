import { runRulesOn } from '../rules/runner'

import { addEvent, popRun, setDomDone } from './store'
import { scheduleFinalize, onAlarm } from './alarms'

import { log } from '@/shared/logs'

export const pushEvent = async (tabId: number, ev: import('./types').EventRec) => {
  await addEvent(tabId, ev)
  if (ev.t.startsWith('dom:')) {
    const data = ev.d as { html?: string } | undefined
    const len = typeof data?.html === 'string' ? data.html.length : 0
    log(tabId, `${ev.t} html=${len}`).catch(() => {})
  }
  if (ev.t === 'nav:before') {
    const { 'ui:autoClear': auto } = await chrome.storage.local.get('ui:autoClear')
    log(tabId, `nav:before url=${ev.u || ''} autoClear=${auto !== false}`).catch(() => {})
    if (auto !== false) await chrome.storage.local.remove(`results:${tabId}`)
  }
  await scheduleFinalize(tabId)
}

export const markDomPhase = async (tabId: number) => {
  await setDomDone(tabId)
  await scheduleFinalize(tabId, 200)
}

onAlarm(async (tabId) => {
  const run = await popRun(tabId)
  if (!run) return
  await runRulesOn(tabId, run)
})
