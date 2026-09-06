import { createRunState, completeRunState, abortRunState } from './runState'
import * as ruleSupport from './support'
import { determineTrigger } from './triggerDetect'
import { startSession, finishSession, withActiveSession } from './sessions'
import { writeActiveRunMeta } from './activeRunMeta'
import { executeRuleBatch } from './runExecutor'
import { applyRunGuards } from './runnerGuards'

import { log } from '@/shared/logs'
import { appendRunHistory } from '@/shared/runHistory'
import { readRunMeta } from '@/shared/runMeta'

const k = (tabId: number) => `results:${tabId}`

export const runRulesOn = async (tabId: number, run: import('../pipeline/types').Run) => {
  const runTimestamp = new Date()
  const runTimestampIso = runTimestamp.toISOString()
  const pageUrl = await ruleSupport.getPageUrl(tabId, run.ev as unknown as Array<{ t: string; u?: string }>)
  const hasDom = ruleSupport.hasDomSnapshot(run.ev as unknown as Array<{ t: string; d?: { facts?: unknown; html?: string } }>)
  const allowed = pageUrl ? ruleSupport.allowedScheme(pageUrl) : hasDom
  const resultsKey = k(tabId)
  const trigger = determineTrigger(run.ev)
  let runState = createRunState(tabId, pageUrl || '(no-url)', trigger)
  const signal = await startSession(tabId, runState.runId, run.id)
  if (!signal) {
    await log(tabId, `runner:superseded tab=${tabId} runId=${runState.runId} generation=${run.id}`)
    return
  }
  let aborted = false
  const onAbort = () => { aborted = true }
  signal.addEventListener('abort', onAbort)
  const settleSession = async (status: Parameters<typeof finishSession>[1]) => {
    signal.removeEventListener('abort', onAbort)
    await finishSession(tabId, status, runState.runId)
  }
  const urlChange = await ruleSupport.checkUrlChange(tabId, pageUrl, readRunMeta)
  if (urlChange.changed) await log(tabId, `runner:url-changed tab=${tabId} runId=${runState.runId} from=${urlChange.prevUrl} to=${urlChange.currentUrl}`)
  await log(tabId, `runner:state-created tab=${tabId} runId=${runState.runId} trigger=${trigger} url=${pageUrl || '(none)'}`)
  await writeActiveRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestampIso, runId: runState.runId, status: 'running' })
  const guard = await withActiveSession(tabId, runState.runId, () => applyRunGuards({
    tabId,
    run,
    runState,
    pageUrl: pageUrl || '',
    hasDom,
    allowed,
    resultsKey,
    runTimestamp: runTimestampIso,
  }))
  if (!guard) { await settleSession('aborted'); return }
  if (guard.stop) {
    runState = guard.runState || runState
    await settleSession(guard.status)
    return
  }
  const key = resultsKey
  const { stored, hadError, aborted: abortedFromExec } = await executeRuleBatch({ tabId, run, runState, key, pageUrl, signal, runTimestamp })
  aborted = aborted || abortedFromExec
  if (aborted) {
    runState = abortRunState(runState)
    await writeActiveRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: 'aborted' })
    await settleSession('aborted')
    await Promise.all([appendRunHistory(runState), log(tabId, `runner:aborted tab=${tabId} runId=${runState.runId} stored=${stored.length}`)])
    return
  }
  await writeActiveRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: hadError ? 'error' : 'completed' })
  runState = completeRunState(runState, stored.length)
  await settleSession(hadError ? 'error' : 'completed')
  await Promise.all([appendRunHistory(runState), log(tabId, `runner:done tab=${tabId} runId=${runState.runId} results=${stored.length} status=${runState.status}`)])
}
