import type { RunState } from './runState'
import type { RuleResult } from './types'
import { createRunState, updateRunState } from './runState'

import { log } from '@/shared/logs'
import { appendRunHistory } from '@/shared/runHistory'
import { writeRunMeta } from '@/shared/runMeta'

type SkipResult = { ruleId: string; what: string; message: string }
type SkippedRun = {
  tabId: number
  url: string
  resultsKey: string
  result: SkipResult
  runState?: RunState
  ranAt?: string
}

export const CMS_BACKEND_RULE = { ruleId: 'system:cms-backend', what: 'CMS safety' } as const

/**
 * Stores one visible "skipped" result, the run meta and a history entry, so
 * the panel says WHY a page was not tested. Shared by every gate that refuses
 * a page (user blocklist, CMS back office / action URL).
 */
export const recordSkippedRun = async ({ tabId, url, resultsKey, result, runState, ranAt }: SkippedRun): Promise<RunState> => {
  const state = runState ?? createRunState(tabId, url, 'auto')
  const res: RuleResult[] = [{
    name: result.ruleId,
    label: 'Runner',
    type: 'info',
    message: result.message,
    runIdentifier: state.runId,
    ruleId: result.ruleId,
    what: result.what,
    priority: -4000,
  }]
  await chrome.storage.local.set({ [resultsKey]: res })
  const updated = updateRunState(state, { status: 'skipped', completedAt: new Date().toISOString(), resultCount: res.length })
  await writeRunMeta(tabId, { url, ranAt: ranAt ?? state.startedAt, runId: state.runId, status: 'skipped' })
  await appendRunHistory(updated)
  await log(tabId, `runner:skipped tab=${tabId} runId=${state.runId} rule=${result.ruleId} url=${url || '(none)'}`)
  return updated
}
