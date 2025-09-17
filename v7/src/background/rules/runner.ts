import { runInOffscreen } from './offscreen'

const k = (tabId: number) => `results:${tabId}`

export const runRulesOn = async (tabId: number, run: import('../pipeline/types').Run) => {
  const { globalRuleVariables, googleApiAccessToken } = await chrome.storage.local.get(['globalRuleVariables','googleApiAccessToken'])
  const globals = {
    variables: globalRuleVariables || {},
    googleApiAccessToken: googleApiAccessToken || null,
    rulesUrl: chrome.runtime.getURL('src/sidepanel.html'),
    codeviewUrl: chrome.runtime.getURL('src/sidepanel.html#codeview'),
  }
  const res = await runInOffscreen<import('./types').RuleResult[]>({ kind: 'runTyped', run, globals })
  const { [k(tabId)]: existing } = await chrome.storage.local.get(k(tabId))
  const merged = Array.isArray(existing) ? [...existing, ...res] : res
  await chrome.storage.local.set({ [k(tabId)]: merged })
}
