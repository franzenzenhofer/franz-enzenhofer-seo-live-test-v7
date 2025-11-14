import type { Rule, Result, Page, Ctx } from './types'

import { Logger } from '@/shared/logger'

const enrichResult = (res: Result, rule: Rule): Result => ({
  ...res,
  what: res.what && res.what.length > 0 ? res.what : rule.name,
  ruleId: res.ruleId ?? rule.id,
})

export const runAll = async (rules: Rule[], page: Page, ctx: Ctx): Promise<Result[]> => {
  const enabledRules = rules.filter((r) => r.enabled)
  await Logger.log('rules', 'start', { total: rules.length, enabled: enabledRules.length, disabled: rules.length - enabledRules.length, url: page.url || 'unknown' })
  const out: Result[] = []
  let enabledIndex = 0
  for (const r of rules) {
    if (!r.enabled) {
      Logger.logSync('rule', 'skip', { id: r.id, name: r.name, reason: 'disabled' })
      continue
    }
    enabledIndex++
    const ruleId = `${r.id}-${Math.random().toString(36).slice(2, 7)}`
    Logger.logSync('rule', 'start', { id: r.id, name: r.name, index: enabledIndex, total: enabledRules.length, ruleId })
    const start = performance.now()
    try {
      const res = await r.run(page, ctx)
      const duration = (performance.now() - start).toFixed(2)
      const results = Array.isArray(res) ? res : [res]
      results.forEach((result, idx) => {
        Logger.logSync('rule', 'result', {
          id: r.id,
          ruleId,
          index: idx + 1,
          type: result.type,
          message: typeof result.message === 'string' && result.message.length > 100 ? result.message.slice(0, 100) + '...' : result.message,
          label: result.label,
        })
      })
      await Logger.log('rule', 'done', { id: r.id, name: r.name, ruleId, duration: `${duration}ms`, results: results.length })
      out.push(...results.map((item) => enrichResult(item, r)))
    } catch (error) {
      await Logger.logError('rule failed', error, { id: r.id, name: r.name, ruleId, duration: `${(performance.now() - start).toFixed(2)}ms` })
    }
  }
  await Logger.log('rules', 'done', {
    total: out.length,
    byType: { ok: out.filter((r) => r.type === 'ok').length, info: out.filter((r) => r.type === 'info').length, warn: out.filter((r) => r.type === 'warn').length, error: out.filter((r) => r.type === 'error').length },
  })
  return out
}
