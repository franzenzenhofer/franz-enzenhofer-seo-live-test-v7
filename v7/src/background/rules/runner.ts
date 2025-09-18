import { runInOffscreen } from './offscreen'
import { allowedScheme, hasDomSnapshot, derivePageUrl, summarizeEvents, persistResults } from './util'

import { log } from '@/shared/logs'

const k = (tabId: number) => `results:${tabId}`

export const runRulesOn = async (tabId: number, run: import('../pipeline/types').Run) => {
  const { globalRuleVariables, googleApiAccessToken } = await chrome.storage.local.get(['globalRuleVariables','googleApiAccessToken'])
  const globals = { variables: globalRuleVariables || {}, googleApiAccessToken: googleApiAccessToken || null, events: run.ev, rulesUrl: chrome.runtime.getURL('src/sidepanel.html'), codeviewUrl: chrome.runtime.getURL('src/sidepanel.html#codeview') }
  // Guard restricted schemes based on nav URL; if missing but DOM exists, allow.
  const pageUrl = derivePageUrl(run.ev as unknown as Array<{t:string;u?:string}>)
  const hasDom = hasDomSnapshot(run.ev as unknown as Array<{t:string; d?:{html?:string}}>)
  const allowed = pageUrl ? allowedScheme(pageUrl) : hasDom
  let res: import('./types').RuleResult[]
  if (!pageUrl && !hasDom) {
    await log(tabId, `runner:skip no-url-yet ev=${run.ev.length}`)
    return
  }
  if (!allowed) {
    const scheme = (pageUrl.split(':',1)[0]||'')
    res = [{ name: 'system:runner', label: 'Runner', type: 'error', message: `Restricted page scheme (${scheme||'(none)'}://). Open an http(s) page to run rules.` }]
    const k2 = k(tabId); const { [k2]: existing } = await chrome.storage.local.get(k2); await chrome.storage.local.set({ [k2]: Array.isArray(existing)?[...existing, ...res]:res })
    return
  }
  // Skip if no DOM snapshot present yet (prevents ev=0/2 noisy runs)
  if (!hasDom) {
    await log(tabId, `runner:skip no-dom ev=${run.ev.length} url=${pageUrl||'(none)'}`)
    return
  }
  try {
    const de = [...run.ev].reverse().find((e) => e.t.startsWith('dom:')) as { d?: { html?: string } } | undefined
    const htmlLen = typeof de?.d?.html === 'string' ? de.d!.html!.length : 0
    const s = summarizeEvents(run.ev as unknown as Array<{t:string;u?:string}>)
    await log(tabId, `runner:start ev=${run.ev.length} url=${pageUrl||'(none)'} html=${htmlLen} navs=${s.navs} reqs=${s.reqs} top=[${s.top}]`)
    const fn = (run.ev.find((e)=> e.t.startsWith('nav:') && typeof (e as {u?:unknown}).u === 'string') as {u?:string}|undefined)?.u || '(none)'
    await log(tabId, `runner:nav first=${fn} last=${pageUrl||'(none)'}`)
    res = await runInOffscreen<import('./types').RuleResult[]>({ kind: 'runTyped', run, globals })
    await log(tabId, `runner:offscreen results=${res.length}`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    res = [{ name:'system:runner', label:'Runner', type:'error', message: msg.includes('offscreen-unavailable') ? 'Offscreen documents are unavailable. Please enable the permission or update Chrome.' : msg.includes('offscreen-timeout') ? 'Timed out waiting for offscreen document.' : `Failed to run rules: ${msg}` }]
  }
  const key = k(tabId)
  const got = await chrome.storage.local.get(key)
  const prev = got[key] as import('./types').RuleResult[] | undefined
  const n = await persistResults(tabId, key, prev, res).catch(async (e)=> { await log(tabId, `runner:save error ${String(e)}`); return -1 })
  if (n >= 0) await log(tabId, `runner:done added=${res.length} total=${n}`)
}
