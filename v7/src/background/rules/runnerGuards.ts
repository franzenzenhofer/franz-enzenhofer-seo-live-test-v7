import type { Run } from '../pipeline/types'

import type { RunState } from './runState'
import type { RuleResult } from './types'
import { updateRunState } from './runState'

import { isUrlBlocked } from '@/shared/blocklist'
import { log } from '@/shared/logs'
import { appendRunHistory } from '@/shared/runHistory'
import { writeRunMeta } from '@/shared/runMeta'

type GuardResult = { stop: boolean; status: 'skipped' | 'error'; runState?: RunState }
type GuardArgs = {
  tabId: number
  run: Run
  runState: RunState
  pageUrl: string
  hasDom: boolean
  allowed: boolean
  resultsKey: string
  runTimestamp: string
}

export const applyRunGuards = async ({
  tabId,
  run,
  runState,
  pageUrl,
  hasDom,
  allowed,
  resultsKey,
  runTimestamp,
}: GuardArgs): Promise<GuardResult | { stop: false }> => {
  if (!pageUrl && !hasDom) {
    await Promise.all([
      log(tabId, `runner:skip tab=${tabId} runId=${runState.runId} no-url-yet ev=${run.ev.length}`),
      writeRunMeta(tabId, { url: '', ranAt: runTimestamp, runId: runState.runId, status: 'skipped' }),
    ])
    return { stop: true, status: 'skipped' }
  }
  if (!allowed) {
    const scheme = (pageUrl.split(':', 1)[0] || '')
    const res: RuleResult[] = [{ name: 'system:runner', label: 'Runner', type: 'error', message: `Restricted page scheme (${scheme || '(none)'}://). Open an http(s) page to run rules.` }]
    const { [resultsKey]: existing } = await chrome.storage.local.get(resultsKey)
    await chrome.storage.local.set({ [resultsKey]: Array.isArray(existing) ? [...existing, ...res] : res })
    await writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp, runId: runState.runId, status: 'error' })
    return { stop: true, status: 'error' }
  }
  const { blocked, matched } = pageUrl ? await isUrlBlocked(pageUrl) : { blocked: false, matched: undefined as string | undefined }
  if (blocked) {
    const res: RuleResult[] = [{
      name: 'system:blocklist',
      label: 'Runner',
      type: 'info',
      message: `Run skipped on blocked URL${matched ? ` (${matched})` : ''}. Update the blocklist in Settings to allow this page.`,
      runIdentifier: runState.runId,
      ruleId: 'system:blocklist',
      what: 'Blocklist',
      priority: -4000,
    }]
    await chrome.storage.local.set({ [resultsKey]: res })
    const updated = updateRunState(runState, { status: 'skipped', completedAt: new Date().toISOString(), resultCount: res.length })
    await writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp, runId: runState.runId, status: 'skipped' })
    await appendRunHistory(updated)
    await log(tabId, `runner:blocklisted tab=${tabId} runId=${runState.runId} url=${pageUrl || '(none)'} matched=${matched || 'none'}`)
    return { stop: true, status: 'skipped', runState: updated }
  }
  if (!hasDom) {
    await Promise.all([
      log(tabId, `runner:skip tab=${tabId} runId=${runState.runId} no-dom ev=${run.ev.length} url=${pageUrl || '(none)'}`),
      writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp, runId: runState.runId, status: 'skipped' }),
    ])
    return { stop: true, status: 'skipped' }
  }
  return { stop: false }
}
