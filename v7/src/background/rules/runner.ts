import { runInOffscreen } from './offscreen'

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
}
