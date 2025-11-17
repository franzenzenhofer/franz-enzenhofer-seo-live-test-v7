import type { Rule, Result, Page, Ctx } from './types'
import { createDisabledResult, createRuntimeError, emitChunk, enrichResult, logRuleResults } from './runHelpers'

import { Logger } from '@/shared/logger'

export const runAll = async (
  tabId: number,
  rules: Rule[],
  page: Page,
  ctx: Ctx,
  emit?: (chunk: Result[]) => Promise<void> | void,
): Promise<Result[]> => {
  const runId = typeof ctx.globals['runId'] === 'string' ? ctx.globals['runId'] : undefined
  const enabledRules = rules.filter((r) => r.enabled)
  Logger.logDirectSend(tabId, 'rules', 'start', { total: rules.length, enabled: enabledRules.length, disabled: rules.length - enabledRules.length, url: page.url || 'unknown' })
  const out: Result[] = []
  let enabledIndex = 0
  for (const r of rules) {
    if (!r.enabled) {
      const disabled = createDisabledResult(r, runId)
      out.push(disabled)
      await emitChunk(emit, [disabled])
      Logger.logDirectSend(tabId, 'rule', 'skip', { id: r.id, name: r.name, reason: 'disabled', state: 'disabled' })
      continue
    }
    enabledIndex++
    const ruleId = `${r.id}-${Math.random().toString(36).slice(2, 7)}`
    Logger.logDirectSend(tabId, 'rule', 'start', { id: r.id, name: r.name, index: enabledIndex, total: enabledRules.length, ruleId })
    const start = performance.now()
    try {
      const res = await r.run(page, ctx)
      const duration = (performance.now() - start).toFixed(2)
      const results = Array.isArray(res) ? res : [res]
      logRuleResults(tabId, r, ruleId, results)
      Logger.logDirectSend(tabId, 'rule', 'done', { id: r.id, name: r.name, ruleId, duration: `${duration}ms`, results: results.length })
      const enriched = results.map((item) => enrichResult(item, r, runId))
      out.push(...enriched)
      await emitChunk(emit, enriched)
    } catch (error) {
      const duration = (performance.now() - start).toFixed(2)
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      Logger.logDirectSend(tabId, 'rule', 'error', { id: r.id, name: r.name, ruleId, error: errorMessage, stack: errorStack, duration: `${duration}ms` })

      const runtimeError = createRuntimeError(r, errorMessage, runId)
      out.push(runtimeError)
      await emitChunk(emit, [runtimeError])
    }
  }
  Logger.logDirectSend(tabId, 'rules', 'done', {
    total: out.length,
    byType: { ok: out.filter((r) => r.type === 'ok').length, info: out.filter((r) => r.type === 'info').length, warn: out.filter((r) => r.type === 'warn').length, error: out.filter((r) => r.type === 'error').length },
  })
  return out
}
