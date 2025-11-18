import { runInOffscreen } from './offscreen'
import * as ruleSupport from './support'
import type { RuleResult } from './types'

import { log } from '@/shared/logs'

type ExecuteArgs = {
  tabId: number
  run: import('../pipeline/types').Run
  runState: import('./runState').RunState
  key: string
  pageUrl?: string
  signal: AbortSignal
  runTimestamp: Date
}

export const executeRuleBatch = async ({ tabId, run, runState, key, pageUrl, signal, runTimestamp }: ExecuteArgs) => {
  const globals = await ruleSupport.buildRunGlobals(tabId, run, runState.runId, runTimestamp)
  const rules = await ruleSupport.getEnabledRules()
  const { enabled: enabledRules, ruleOverrides, timeoutMs } = ruleSupport.prepareRulesForRun(rules)
  await ruleSupport.prepareResultsStorage(tabId, key, enabledRules, runState.runId)
  const chunkSync = ruleSupport.createChunkSync(tabId, key, runState.runId)
  let aborted = false
  let hadError = false
  let res: RuleResult[] = []
  try {
    const de = [...run.ev].reverse().find((e) => e.t.startsWith('dom:')) as { d?: { html?: string } } | undefined
    const htmlLen = typeof de?.d?.html === 'string' ? de.d!.html!.length : 0
    const summary = ruleSupport.summarizeEvents(run.ev as unknown as Array<{ t: string; u?: string }>)
    await log(tabId, `runner:start tab=${tabId} runId=${runState.runId} ev=${run.ev.length} url=${pageUrl || '(none)'} html=${htmlLen} navs=${summary.navs} reqs=${summary.reqs} top=[${summary.top}]`)
    const firstNav = (run.ev.find((e) => e.t.startsWith('nav:') && typeof (e as { u?: unknown }).u === 'string') as { u?: string } | undefined)?.u || '(none)'
    await log(tabId, `runner:nav tab=${tabId} runId=${runState.runId} first=${firstNav} last=${pageUrl || '(none)'}`)
    res = await runInOffscreen<RuleResult[]>(
      tabId,
      { kind: 'runTyped', run, globals, pageUrl, ruleOverrides },
      timeoutMs,
      (chunk) => chunkSync.append(Array.isArray(chunk) ? (chunk as RuleResult[]) : []),
      { signal },
    )
    await log(tabId, `runner:offscreen tab=${tabId} runId=${runState.runId} results=${res.length}`)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'offscreen-run-cancelled') {
      aborted = true
    } else {
      hadError = true
      const msg = e instanceof Error ? e.message : String(e)
      res = [{ name: 'system:runner', label: 'Runner', type: 'error', message: msg.includes('offscreen-unavailable') ? 'Offscreen documents are unavailable. Please enable the permission or update Chrome.' : msg.includes('offscreen-timeout') ? 'Timed out waiting for offscreen document.' : `Failed to run rules: ${msg}` }]
      await chunkSync.append(res)
    }
  }
  await chunkSync.flush()
  const stored = ((await chrome.storage.local.get(key))[key] as RuleResult[]) || []
  return { stored, hadError, aborted }
}
