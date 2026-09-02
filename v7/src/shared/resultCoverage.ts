import type { Result } from './results'

import { isDebugRuleId } from '@/rules/debugRules'
import { rulesInventory, type RuleSummary } from '@/rules/inventory'

export type CoverageSummary = {
  totalRules: number
  coveredRules: number
  missingRules: RuleSummary[]
}

export const computeResultCoverage = (results: Result[]): CoverageSummary => {
  const seen = new Set<string>()
  for (const result of results) {
    if (result.ruleId) {
      seen.add(result.ruleId)
      continue
    }
    if (result.name) seen.add(`name:${result.name.toLowerCase()}`)
  }

  // Debug rules only count when they actually ran - they are never reported as missing
  const relevantRules = rulesInventory.filter((rule) => !isDebugRuleId(rule.id) || seen.has(rule.id))
  const missingRules = relevantRules.filter((rule) => !seen.has(rule.id))

  return {
    totalRules: relevantRules.length,
    coveredRules: seen.size,
    missingRules,
  }
}
