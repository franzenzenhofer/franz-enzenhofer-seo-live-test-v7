import type { Result, ResultDetails, Rule } from './types'

import { executionPresentation, validateRulePresentation } from '@/shared/presentation/result'
import { Logger } from '@/shared/logger'

// Every result carries the rule's spec reference and provenance; values a rule
// sets itself in details win over the injected defaults.
export const metaDetails = (rule: Rule, details?: ResultDetails): ResultDetails => ({
  ...(rule.meta.references[0] ? { reference: rule.meta.references[0] } : {}),
  provenance: rule.meta.provenance,
  ...(rule.meta.userGuide ? { whatThisChecks: rule.meta.userGuide.check } : {}),
  ...details,
})

export const enrichResult = (res: Result, rule: Rule, runId: string | undefined, runIndex?: number): Result => ({
  ...res,
  what: rule.what,
  ruleId: res.ruleId ?? rule.id,
  runIdentifier: runId,
  runIndex: typeof runIndex === 'number' ? runIndex : res.runIndex,
  presentation: validateRulePresentation(res, rule),
  details: rule.presentation === 1 ? undefined : metaDetails(rule, {
    ...(rule.meta.userGuide && ['warn', 'error'].includes(res.type)
      && !res.details?.['fix'] && !res.details?.['should'] && !res.details?.['nextStep']
      ? { nextStep: rule.meta.userGuide.action } : {}),
    ...res.details,
  }),
})

export const emitChunk = async (emit: ((chunk: Result[]) => Promise<void> | void) | undefined, chunk: Result[]) => {
  if (!emit || !chunk.length) return
  try {
    await emit(chunk)
  } catch {
    // Ignore emission errors to keep rule execution flowing
  }
}

export const createDisabledResult = (rule: Rule, runId: string | undefined, runIndex?: number): Result => ({
  name: rule.name,
  label: (rule.id.split(':')[0] || 'RULE').toUpperCase(),
  message: 'Rule disabled in settings. Enable to run checks.',
  type: 'disabled',
  presentation: executionPresentation(rule, 'Disabled'),
  what: rule.what || null,
  ruleId: rule.id,
  runIdentifier: runId,
  priority: -3000,
  runIndex,
  details: metaDetails(rule),
})

export const createRuntimeError = (rule: Rule, message: string, runId: string | undefined, runIndex?: number): Result => ({
  name: rule.name,
  label: 'SYSTEM',
  message: `Rule execution failed: ${rule.name} - ${message}`,
  type: 'runtime_error',
  presentation: executionPresentation(rule, `Execution failed: ${message}`),
  what: rule.name,
  ruleId: rule.id,
  runIdentifier: runId,
  runIndex,
  priority: -1000,
  details: metaDetails(rule),
})

export const logRuleResults = (tabId: number, rule: Rule, ruleId: string, results: Result[], runIndex?: number) => {
  results.forEach((result, idx) => {
    Logger.logDirectSend(tabId, 'rule', 'result', {
      id: rule.id,
      ruleId,
      index: idx + 1,
      runIndex,
      type: result.type,
      message: typeof result.message === 'string' && result.message.length > 100 ? result.message.slice(0, 100) + '...' : result.message,
      label: result.label,
    })
  })
}
