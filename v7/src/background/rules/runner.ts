import { runInOffscreen } from './offscreen'
import { createRunState, completeRunState } from './runState'
import * as ruleSupport from './support'
import { determineTrigger } from './triggerDetect'
import type { RuleResult } from './types'

import { log } from '@/shared/logs'
import { writeRunMeta } from '@/shared/runMeta'

const k = (tabId: number) => `results:${tabId}`

export const runRulesOn = async (tabId: number, run: import('../pipeline/types').Run) => {
  const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, runTimestamp = new Date()
  const globals = await ruleSupport.buildRunGlobals(run, runId, runTimestamp)
  const pageUrl = ruleSupport.derivePageUrl(run.ev as unknown as Array<{t:string;u?:string}>)
  const hasDom = ruleSupport.hasDomSnapshot(run.ev as unknown as Array<{t:string; d?:{html?:string}}>)
  const allowed = pageUrl ? ruleSupport.allowedScheme(pageUrl) : hasDom

  // Create run state for tracking
  const trigger = determineTrigger(run.ev)
  let runState = createRunState(tabId, pageUrl || '(no-url)', trigger)
  await log(tabId, `runner:state-created runId=${runState.runId} trigger=${trigger} url=${pageUrl || '(none)'}`)
  let res: RuleResult[] = []
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
  if (!hasDom) {
    await log(tabId, `runner:skip no-dom ev=${run.ev.length} url=${pageUrl||'(none)'}`)
    return
  }
  const key = k(tabId)
  await chrome.storage.local.remove(key)
  await log(tabId, `runner:cleared old results for new test`)
  const rules = await ruleSupport.getEnabledRules()
  const { enabled: enabledRules, ruleOverrides, timeoutMs } = ruleSupport.prepareRulesForRun(rules)
  const pending = ruleSupport.buildPendingResults(enabledRules)
  if (pending.length) {
    await chrome.storage.local.set({ [key]: pending })
    await log(tabId, `runner:pending seeded count=${pending.length}`)
  }
  const chunkSync = ruleSupport.createChunkSync(tabId, key)

  try {
    const de = [...run.ev].reverse().find((e) => e.t.startsWith('dom:')) as { d?: { html?: string } } | undefined
    const htmlLen = typeof de?.d?.html === 'string' ? de.d!.html!.length : 0
    const s = ruleSupport.summarizeEvents(run.ev as unknown as Array<{t:string;u?:string}>)
    await log(tabId, `runner:start ev=${run.ev.length} url=${pageUrl||'(none)'} html=${htmlLen} navs=${s.navs} reqs=${s.reqs} top=[${s.top}]`)
    const fn = (run.ev.find((e)=> e.t.startsWith('nav:') && typeof (e as {u?:unknown}).u === 'string') as {u?:string}|undefined)?.u || '(none)'
    await log(tabId, `runner:nav first=${fn} last=${pageUrl||'(none)'}`)
    res = await runInOffscreen<RuleResult[]>(
      tabId,
      { kind: 'runTyped', run, globals, pageUrl, ruleOverrides },
      timeoutMs,
      (chunk) => chunkSync.append(Array.isArray(chunk) ? (chunk as RuleResult[]) : []),
    )
    for (let i = 0; i < res.length; i++) {
      await log(tabId, `runner:result ${i + 1}/${res.length} payload=${JSON.stringify(res[i])}`)
    }
    await log(tabId, `runner:offscreen results=${res.length}`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    res = [{ name:'system:runner', label:'Runner', type:'error', message: msg.includes('offscreen-unavailable') ? 'Offscreen documents are unavailable. Please enable the permission or update Chrome.' : msg.includes('offscreen-timeout') ? 'Timed out waiting for offscreen document.' : `Failed to run rules: ${msg}` }]
    await chunkSync.append(res)
  }
  await chunkSync.flush()
  const got = await chrome.storage.local.get(key)
  const stored = (got[key] as RuleResult[]) || []
  await writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp.toISOString(), runId })

  // Complete run state tracking
  runState = completeRunState(runState, stored.length)
  await log(tabId, `runner:state-completed runId=${runState.runId} results=${stored.length} status=${runState.status}`)
  await log(tabId, `runner:done stored=${stored.length}`)
}
