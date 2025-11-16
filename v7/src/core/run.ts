import type { Rule, Result, Page, Ctx } from './types'

import { Logger } from '@/shared/logger'

const enrichResult = (res: Result, rule: Rule): Result => ({
  ...res,
  what: res.what && res.what.length > 0 ? res.what : rule.name,
  ruleId: res.ruleId ?? rule.id,
})

export const runAll = async (tabId: number, rules: Rule[], page: Page, ctx: Ctx): Promise<Result[]> => {
  const enabledRules = rules.filter((r) => r.enabled)
  Logger.logDirectSend(tabId, 'rules', 'start', { total: rules.length, enabled: enabledRules.length, disabled: rules.length - enabledRules.length, url: page.url || 'unknown' })
  const out: Result[] = []
  let enabledIndex = 0
  for (const r of rules) {
    if (!r.enabled) {
      // Create disabled result for rules disabled in settings
      const label = (r.id.split(':')[0] || 'RULE').toUpperCase()
      const disabledResult: Result = {
        label,
        message: 'Rule disabled in settings. Enable to run checks.',
        type: 'disabled',
        what: r.what || null,
        ruleId: r.id,
        priority: -3000, // Lower priority than runtime errors
      }
      out.push(disabledResult)
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
      results.forEach((result, idx) => {
        Logger.logDirectSend(tabId, 'rule', 'result', {
          id: r.id,
          ruleId,
          index: idx + 1,
          type: result.type,
          message: typeof result.message === 'string' && result.message.length > 100 ? result.message.slice(0, 100) + '...' : result.message,
          label: result.label,
        })
      })
      Logger.logDirectSend(tabId, 'rule', 'done', { id: r.id, name: r.name, ruleId, duration: `${duration}ms`, results: results.length })
      out.push(...results.map((item) => enrichResult(item, r)))
    } catch (error) {
      const duration = (performance.now() - start).toFixed(2)
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      Logger.logDirectSend(tabId, 'rule', 'error', { id: r.id, name: r.name, ruleId, error: errorMessage, stack: errorStack, duration: `${duration}ms` })

      // Create runtime_error result for failed rule execution
      const runtimeErrorResult: Result = {
        label: 'SYSTEM',
        message: `Rule execution failed: ${r.name} - ${errorMessage}`,
        type: 'runtime_error',
        what: r.name,
        ruleId: r.id,
        priority: -1000, // Low priority for runtime errors
      }
      out.push(runtimeErrorResult)
    }
  }
  Logger.logDirectSend(tabId, 'rules', 'done', {
    total: out.length,
    byType: { ok: out.filter((r) => r.type === 'ok').length, info: out.filter((r) => r.type === 'info').length, warn: out.filter((r) => r.type === 'warn').length, error: out.filter((r) => r.type === 'error').length },
  })
  return out
}
