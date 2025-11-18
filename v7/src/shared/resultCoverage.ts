import type { Result } from './results'

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

  const missingRules = rulesInventory.filter((rule) => !seen.has(rule.id))

  return {
    totalRules: rulesInventory.length,
    coveredRules: seen.size,
    missingRules,
  }
}
