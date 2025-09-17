import { runInOffscreen } from './offscreen'

import { log } from '@/shared/logs'

const k = (tabId: number) => `results:${tabId}`

export const runRulesOn = async (tabId: number, run: import('../pipeline/types').Run) => {
  const { globalRuleVariables, googleApiAccessToken } = await chrome.storage.local.get(['globalRuleVariables','googleApiAccessToken'])
  const globals = {
    variables: globalRuleVariables || {},
    googleApiAccessToken: googleApiAccessToken || null,
    events: run.ev,
    rulesUrl: chrome.runtime.getURL('src/sidepanel.html'),
    codeviewUrl: chrome.runtime.getURL('src/sidepanel.html#codeview'),
  }
  let res: import('./types').RuleResult[]
  try {
    const lastDom = [...run.ev].reverse().find((e) => e.t.startsWith('dom:')) as { d?: { html?: string } } | undefined
    const htmlLen = typeof lastDom?.d?.html === 'string' ? lastDom.d!.html!.length : 0
    const reqs = run.ev.filter(e=> e.t === 'req:headers').length
    await log(tabId, `runner:start ev=${run.ev.length} html=${htmlLen} reqs=${reqs}`)
    res = await runInOffscreen<import('./types').RuleResult[]>({ kind: 'runTyped', run, globals })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    res = [{
      name: 'system:runner',
      label: 'Runner',
      type: 'error',
      message: msg.includes('offscreen-unavailable')
        ? 'Offscreen documents are unavailable. Please enable the permission or update Chrome.'
        : msg.includes('offscreen-timeout')
        ? 'Timed out waiting for offscreen document.'
        : `Failed to run rules: ${msg}`,
    }]
  }
  const { [k(tabId)]: existing } = await chrome.storage.local.get(k(tabId))
  const merged = Array.isArray(existing) ? [...existing, ...res] : res
  await chrome.storage.local.set({ [k(tabId)]: merged })
  await log(tabId, `runner:done added=${res.length} total=${merged.length}`)
}
