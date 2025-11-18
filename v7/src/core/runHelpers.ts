import type { Result, Rule } from './types'

import { Logger } from '@/shared/logger'

export const enrichResult = (res: Result, rule: Rule, runId: string | undefined): Result => ({
  ...res,
  what: rule.what,
  ruleId: res.ruleId ?? rule.id,
  runIdentifier: runId,
})

export const emitChunk = async (emit: ((chunk: Result[]) => Promise<void> | void) | undefined, chunk: Result[]) => {
  if (!emit || !chunk.length) return
  try {
    await emit(chunk)
  } catch {
    // Ignore emission errors to keep rule execution flowing
  }
}

export const createDisabledResult = (rule: Rule, runId: string | undefined): Result => ({
  name: rule.name,
  label: (rule.id.split(':')[0] || 'RULE').toUpperCase(),
  message: 'Rule disabled in settings. Enable to run checks.',
  type: 'disabled',
  what: rule.what || null,
  ruleId: rule.id,
  runIdentifier: runId,
  priority: -3000,
})

export const createRuntimeError = (rule: Rule, message: string, runId: string | undefined): Result => ({
  name: rule.name,
  label: 'SYSTEM',
  message: `Rule execution failed: ${rule.name} - ${message}`,
  type: 'runtime_error',
  what: rule.name,
  ruleId: rule.id,
  runIdentifier: runId,
  priority: -1000,
})

export const logRuleResults = (tabId: number, rule: Rule, ruleId: string, results: Result[]) => {
  results.forEach((result, idx) => {
    Logger.logDirectSend(tabId, 'rule', 'result', {
      id: rule.id,
      ruleId,
      index: idx + 1,
      type: result.type,
      message: typeof result.message === 'string' && result.message.length > 100 ? result.message.slice(0, 100) + '...' : result.message,
      label: result.label,
    })
  })
}
