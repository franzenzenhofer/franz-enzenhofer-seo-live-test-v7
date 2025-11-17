import { runInOffscreen } from './offscreen'
import { createRunState, completeRunState } from './runState'
import * as ruleSupport from './support'
import { determineTrigger } from './triggerDetect'
import type { RuleResult } from './types'

import { log } from '@/shared/logs'
import { appendRunHistory } from '@/shared/runHistory'
import { readRunMeta, writeRunMeta } from '@/shared/runMeta'

const k = (tabId: number) => `results:${tabId}`

export const runRulesOn = async (tabId: number, run: import('../pipeline/types').Run) => {
  const runTimestamp = new Date()
  const pageUrl = await ruleSupport.getPageUrl(tabId, run.ev as unknown as Array<{t:string;u?:string}>)
  const hasDom = ruleSupport.hasDomSnapshot(run.ev as unknown as Array<{t:string; d?:{html?:string}}>)
  const allowed = pageUrl ? ruleSupport.allowedScheme(pageUrl) : hasDom
  const trigger = determineTrigger(run.ev)
  let runState = createRunState(tabId, pageUrl || '(no-url)', trigger)
  const urlChange = await ruleSupport.checkUrlChange(tabId, pageUrl, readRunMeta)
  if (urlChange.changed) await log(tabId, `runner:url-changed tab=${tabId} runId=${runState.runId} from=${urlChange.prevUrl} to=${urlChange.currentUrl}`)
  await log(tabId, `runner:state-created tab=${tabId} runId=${runState.runId} trigger=${trigger} url=${pageUrl || '(none)'}`)
  await writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: 'running' })
  const globals = await ruleSupport.buildRunGlobals(run, runState.runId, runTimestamp); let res: RuleResult[] = []
  if (!pageUrl && !hasDom) {
    await Promise.all([log(tabId, `runner:skip tab=${tabId} runId=${runState.runId} no-url-yet ev=${run.ev.length}`), writeRunMeta(tabId, { url: '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: 'skipped' })])
    return
  }
  if (!allowed) {
    const scheme = (pageUrl.split(':',1)[0]||'')
    res = [{ name: 'system:runner', label: 'Runner', type: 'error', message: `Restricted page scheme (${scheme||'(none)'}://). Open an http(s) page to run rules.` }]
    const k2 = k(tabId); const { [k2]: existing } = await chrome.storage.local.get(k2); await chrome.storage.local.set({ [k2]: Array.isArray(existing)?[...existing, ...res]:res })
    await writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: 'error' })
    return
  }
  if (!hasDom) {
    await Promise.all([log(tabId, `runner:skip tab=${tabId} runId=${runState.runId} no-dom ev=${run.ev.length} url=${pageUrl||'(none)'}`), writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: 'skipped' })])
    return
  }
  const key = k(tabId)
  await chrome.storage.local.remove(key)
  await log(tabId, `runner:cleared tab=${tabId} runId=${runState.runId} old results for new test`)
  const rules = await ruleSupport.getEnabledRules()
  const { enabled: enabledRules, ruleOverrides, timeoutMs } = ruleSupport.prepareRulesForRun(rules)
  const pending = ruleSupport.buildPendingResults(enabledRules)
  if (pending.length) {
    await chrome.storage.local.set({ [key]: pending })
    await log(tabId, `runner:pending tab=${tabId} runId=${runState.runId} seeded count=${pending.length}`)
  }
  const chunkSync = ruleSupport.createChunkSync(tabId, key)
  let hadError = false
  try {
    const de = [...run.ev].reverse().find((e) => e.t.startsWith('dom:')) as { d?: { html?: string } } | undefined
    const htmlLen = typeof de?.d?.html === 'string' ? de.d!.html!.length : 0
    const s = ruleSupport.summarizeEvents(run.ev as unknown as Array<{t:string;u?:string}>)
    await log(tabId, `runner:start tab=${tabId} runId=${runState.runId} ev=${run.ev.length} url=${pageUrl||'(none)'} html=${htmlLen} navs=${s.navs} reqs=${s.reqs} top=[${s.top}]`)
    const fn = (run.ev.find((e)=> e.t.startsWith('nav:') && typeof (e as {u?:unknown}).u === 'string') as {u?:string}|undefined)?.u || '(none)'
    await log(tabId, `runner:nav tab=${tabId} runId=${runState.runId} first=${fn} last=${pageUrl||'(none)'}`)
    res = await runInOffscreen<RuleResult[]>(
      tabId,
      { kind: 'runTyped', run, globals, pageUrl, ruleOverrides },
      timeoutMs,
      (chunk) => chunkSync.append(Array.isArray(chunk) ? (chunk as RuleResult[]) : []),
    )
    await log(tabId, `runner:offscreen tab=${tabId} runId=${runState.runId} results=${res.length}`)
  } catch (e: unknown) {
    hadError = true
    const msg = e instanceof Error ? e.message : String(e)
    res = [{ name:'system:runner', label:'Runner', type:'error', message: msg.includes('offscreen-unavailable') ? 'Offscreen documents are unavailable. Please enable the permission or update Chrome.' : msg.includes('offscreen-timeout') ? 'Timed out waiting for offscreen document.' : `Failed to run rules: ${msg}` }]
    await chunkSync.append(res)
  }
  await chunkSync.flush()
  const stored = ((await chrome.storage.local.get(key))[key] as RuleResult[]) || []
  await writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: hadError ? 'error' : 'completed' })
  runState = completeRunState(runState, stored.length)
  await Promise.all([appendRunHistory(runState), log(tabId, `runner:done tab=${tabId} runId=${runState.runId} results=${stored.length} status=${runState.status}`)])
}
