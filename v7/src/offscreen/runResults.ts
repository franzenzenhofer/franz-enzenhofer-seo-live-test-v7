import { createDisabledResult } from '@/core/runHelpers'
import { boundResult } from '@/shared/boundResult'
import type { RegisteredRule, Result } from '@/core/types'

const indexesFor = (rules: RegisteredRule[]) => {
  let index = 0
  return new Map(rules.filter((rule) => rule.enabled).map((rule) => [rule.id, ++index]))
}

export const normalizeRunResult = (
  rules: RegisteredRule[],
  result: Result,
  runId?: string,
) => {
  const rule = rules.find((candidate) => candidate.id === result.ruleId)
  if (!rule) return boundResult({ ...result, runIdentifier: runId })
  return boundResult({
    ...result,
    ruleId: rule.id,
    what: rule.what,
    runIdentifier: runId,
    runIndex: indexesFor(rules).get(rule.id),
  })
}

const unavailableResult = (rule: RegisteredRule, runId?: string): Result => ({
  name: rule.name,
  label: rule.input.toUpperCase(),
  message: rule.input === 'context'
    ? 'Required bounded DOM context unavailable or truncated.'
    : `${rule.input === 'static' ? 'Static' : rule.input === 'idle' ? 'Idle' : 'Cross-phase'} DOM lifecycle unavailable.`,
  type: 'runtime_error',
  priority: 950,
  ruleId: rule.id,
  runIdentifier: runId,
})

export const mergeRunResults = (
  rules: RegisteredRule[],
  phaseResults: Result[],
  offscreenResults: Result[],
  runId?: string,
) => {
  const byRule = new Map([...phaseResults, ...offscreenResults].map((result) => [result.ruleId, result]))
  return rules.map((rule) => {
    const found = byRule.get(rule.id)
    const result = found || (!rule.enabled
      ? createDisabledResult(rule, runId)
      : unavailableResult(rule, runId))
    return normalizeRunResult(rules, result, runId)
  })
}
