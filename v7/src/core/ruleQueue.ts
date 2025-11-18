import type { Ctx, Page, Result, Rule } from './types'
import { createRuntimeError, emitChunk, enrichResult, logRuleResults } from './runHelpers'
import { getRuleTimeoutMs } from './ruleTimeouts'

import { Logger } from '@/shared/logger'

type Task = { rule: Rule; slot: number; ordinal: number }
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

const MAX_CONCURRENCY = 4
export const CANCELLATION_ERROR = 'rule-run-cancelled'
const TIMEOUT_ERROR = 'rule-timeout'

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
  const { rule, slot, ordinal } = task
  const { tabId, page, ctx, runId, emit, assign, signal } = opts
  const ruleId = `${rule.id}-${Math.random().toString(36).slice(2, 7)}`
  Logger.logDirectSend(tabId, 'rule', 'start', { id: rule.id, name: rule.name, index: ordinal, total, ruleId })
  const started = performance.now()
  const timeoutMs = getRuleTimeoutMs(rule)
  try {
    const result = await withTimeout(rule.run(page, ctx), timeoutMs, signal)
    const duration = (performance.now() - started).toFixed(2)
    logRuleResults(tabId, rule, ruleId, [result])
    Logger.logDirectSend(tabId, 'rule', 'done', { id: rule.id, name: rule.name, ruleId, duration: `${duration}ms`, results: 1 })
    const enriched = enrichResult(result, rule, runId)
    assign(slot, enriched)
    await emitChunk(emit, [enriched])
  } catch (error) {
    if (error instanceof Error && error.message === CANCELLATION_ERROR) throw error
    const duration = (performance.now() - started).toFixed(2)
    const isTimeout = error instanceof Error && error.message === TIMEOUT_ERROR
    const message = isTimeout ? `Rule timed out after ${timeoutMs}ms` : error instanceof Error ? error.message : String(error)
    Logger.logDirectSend(tabId, 'rule', 'error', { id: rule.id, name: rule.name, ruleId, error: message, duration: `${duration}ms` })
    const runtimeError = createRuntimeError(rule, message, runId)
    assign(slot, runtimeError)
    await emitChunk(emit, [runtimeError])
  }
}

export const runRuleQueue = async (opts: ExecOpts) => {
  const { tasks, signal } = opts
  if (!tasks.length) return
  let cursor = 0
  const total = tasks.length
  const next = () => (cursor < total ? tasks[cursor++] : null)
  const worker = async () => {
    while (true) {
      if (signal?.aborted) throw new Error(CANCELLATION_ERROR)
      const task = next()
      if (!task) break
      await runTask(task, opts, total)
    }
  }
  const limit = Math.min(MAX_CONCURRENCY, total)
  await Promise.all(Array.from({ length: limit }, worker)).catch((err) => {
    if (err instanceof Error && err.message === CANCELLATION_ERROR) throw err
    throw err
  })
  if (signal?.aborted) throw new Error(CANCELLATION_ERROR)
}
