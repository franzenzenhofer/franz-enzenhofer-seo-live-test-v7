import { createRunState, completeRunState, abortRunState } from './runState'
import * as ruleSupport from './support'
import { determineTrigger } from './triggerDetect'
import type { RuleResult } from './types'
import { abortSession, startSession, finishSession } from './sessions'
import { executeRuleBatch } from './runExecutor'

import { log } from '@/shared/logs'
import { appendRunHistory } from '@/shared/runHistory'
import { readRunMeta, writeRunMeta } from '@/shared/runMeta'

const k = (tabId: number) => `results:${tabId}`

export const runRulesOn = async (tabId: number, run: import('../pipeline/types').Run) => {
  await abortSession(tabId, 'superseded')
  const runTimestamp = new Date()
  const pageUrl = await ruleSupport.getPageUrl(tabId, run.ev as unknown as Array<{ t: string; u?: string }>)
  const hasDom = ruleSupport.hasDomSnapshot(run.ev as unknown as Array<{ t: string; d?: { html?: string } }>)
  const allowed = pageUrl ? ruleSupport.allowedScheme(pageUrl) : hasDom
  const trigger = determineTrigger(run.ev)
  let runState = createRunState(tabId, pageUrl || '(no-url)', trigger)
  const signal = await startSession(tabId, runState.runId)
  let aborted = false
  const onAbort = () => { aborted = true }
  signal.addEventListener('abort', onAbort)
  const settleSession = async (status: Parameters<typeof finishSession>[1]) => {
    signal.removeEventListener('abort', onAbort)
    await finishSession(tabId, status)
  }
  const urlChange = await ruleSupport.checkUrlChange(tabId, pageUrl, readRunMeta)
  if (urlChange.changed) await log(tabId, `runner:url-changed tab=${tabId} runId=${runState.runId} from=${urlChange.prevUrl} to=${urlChange.currentUrl}`)
  await log(tabId, `runner:state-created tab=${tabId} runId=${runState.runId} trigger=${trigger} url=${pageUrl || '(none)'}`)
  await writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: 'running' })
  if (!pageUrl && !hasDom) {
    await Promise.all([log(tabId, `runner:skip tab=${tabId} runId=${runState.runId} no-url-yet ev=${run.ev.length}`), writeRunMeta(tabId, { url: '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: 'skipped' })])
    await settleSession('skipped')
    return
  }
  if (!allowed) {
    const scheme = (pageUrl.split(':', 1)[0] || '')
    const res: RuleResult[] = [{ name: 'system:runner', label: 'Runner', type: 'error', message: `Restricted page scheme (${scheme || '(none)'}://). Open an http(s) page to run rules.` }]
    const k2 = k(tabId); const { [k2]: existing } = await chrome.storage.local.get(k2); await chrome.storage.local.set({ [k2]: Array.isArray(existing) ? [...existing, ...res] : res })
    await writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: 'error' })
    await settleSession('error')
    return
  }
  if (!hasDom) {
    await Promise.all([log(tabId, `runner:skip tab=${tabId} runId=${runState.runId} no-dom ev=${run.ev.length} url=${pageUrl || '(none)'}`), writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: 'skipped' })])
    await settleSession('skipped')
    return
  }
  const key = k(tabId)
  const { stored, hadError, aborted: abortedFromExec } = await executeRuleBatch({ tabId, run, runState, key, pageUrl, signal, runTimestamp })
  aborted = aborted || abortedFromExec
  if (aborted) {
    runState = abortRunState(runState)
    await writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: 'aborted' })
    await settleSession('aborted')
    await Promise.all([appendRunHistory(runState), log(tabId, `runner:aborted tab=${tabId} runId=${runState.runId} stored=${stored.length}`)])
    return
  }
  await writeRunMeta(tabId, { url: pageUrl || '', ranAt: runTimestamp.toISOString(), runId: runState.runId, status: hadError ? 'error' : 'completed' })
  runState = completeRunState(runState, stored.length)
  await settleSession(hadError ? 'error' : 'completed')
  await Promise.all([appendRunHistory(runState), log(tabId, `runner:done tab=${tabId} runId=${runState.runId} results=${stored.length} status=${runState.status}`)])
}
