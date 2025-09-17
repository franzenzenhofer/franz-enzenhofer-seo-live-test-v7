import { runRulesOn } from '../rules/runner'

import { addEvent, popRun, setDomDone } from './store'
import { scheduleFinalize, onAlarm } from './alarms'
import type { EventRec } from './types'

export const pushEvent = async (tabId: number, ev: EventRec) => {
  await addEvent(tabId, ev)
  if (ev.t === 'nav:before') {
    const { 'ui:autoClear': auto } = await chrome.storage.local.get('ui:autoClear')
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
