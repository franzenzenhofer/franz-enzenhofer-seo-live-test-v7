import type { Ctx, Page, Result, Rule } from './types'
import { createRuntimeError, emitChunk, enrichResult, logRuleResults } from './runHelpers'
import { DEFAULT_TIMEOUT_MS, getRuleTimeoutMs } from './ruleTimeouts'
import { CANCELLATION_ERROR, runPool } from './rulePool'

import { Logger } from '@/shared/logger'

type Task = { rule: Rule; slot: number; runIndex: number }
type ExecOpts = {
  tabId: number
  page: Page
  ctx: Ctx
  runId?: string
  tasks: Task[]
  assign: (slot: number, result: Result) => void
  emit?: (chunk: Result[]) => Promise<void> | void
  signal?: AbortSignal
}

// Fast rules are pure DOM work (single-digit ms). Slow rules are network-bound
// (PSI ~20s, GSC, crawlers). They get separate lanes so one PageSpeed run can
// never starve the 120+ cheap rules queued behind it.
const FAST_CONCURRENCY = 8
const SLOW_CONCURRENCY = 4
const TIMEOUT_ERROR = 'rule-timeout'

export { CANCELLATION_ERROR }

const isSlow = (rule: Rule) => getRuleTimeoutMs(rule) > DEFAULT_TIMEOUT_MS

const withTimeout = <T>(promise: Promise<T>, ms: number, signal?: AbortSignal) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(TIMEOUT_ERROR)), ms)
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort) }
    const onAbort = () => { cleanup(); reject(new Error(CANCELLATION_ERROR)) }
    if (signal?.aborted) { cleanup(); reject(new Error(CANCELLATION_ERROR)); return }
    signal?.addEventListener('abort', onAbort, { once: true })
    promise.then((val) => { cleanup(); resolve(val) }).catch((err) => { cleanup(); reject(err) })
  })

const runTask = async (task: Task, opts: ExecOpts, total: number) => {
  const { rule, slot, runIndex } = task
  const { tabId, page, ctx, runId, emit, assign, signal } = opts
  const ruleId = `${rule.id}-${Math.random().toString(36).slice(2, 7)}`
  Logger.logDirectSend(tabId, 'rule', 'start', { id: rule.id, name: rule.name, index: runIndex, total, ruleId })
  const started = performance.now()
  const timeoutMs = getRuleTimeoutMs(rule)
  try {
    const result = await withTimeout(rule.run(page, ctx), timeoutMs, signal)
    const duration = (performance.now() - started).toFixed(2)
    logRuleResults(tabId, rule, ruleId, [result], runIndex)
    Logger.logDirectSend(tabId, 'rule', 'done', { id: rule.id, name: rule.name, ruleId, duration: `${duration}ms`, results: 1 })
    const enriched = enrichResult(result, rule, runId, runIndex)
    assign(slot, enriched)
    await emitChunk(emit, [enriched])
  } catch (error) {
    if (error instanceof Error && error.message === CANCELLATION_ERROR) throw error
    const duration = (performance.now() - started).toFixed(2)
    const isTimeout = error instanceof Error && error.message === TIMEOUT_ERROR
    const message = isTimeout ? `Rule timed out after ${timeoutMs}ms` : error instanceof Error ? error.message : String(error)
    Logger.logDirectSend(tabId, 'rule', 'error', { id: rule.id, name: rule.name, ruleId, error: message, duration: `${duration}ms` })
    const runtimeError = createRuntimeError(rule, message, runId, runIndex)
    assign(slot, runtimeError)
    await emitChunk(emit, [runtimeError])
  }
}

export const runRuleQueue = async (opts: ExecOpts) => {
  const { tasks, signal } = opts
  if (!tasks.length) return
  const total = tasks.length
  const run = (task: Task) => runTask(task, opts, total)
  const lane = (slow: boolean, concurrency: number) =>
    runPool({ tasks: tasks.filter((t) => isSlow(t.rule) === slow), concurrency, signal, run })
  await Promise.all([lane(false, FAST_CONCURRENCY), lane(true, SLOW_CONCURRENCY)])
  if (signal?.aborted) throw new Error(CANCELLATION_ERROR)
}
