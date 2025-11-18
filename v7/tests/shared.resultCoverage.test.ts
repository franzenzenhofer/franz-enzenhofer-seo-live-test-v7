import { describe, expect, it } from 'vitest'

import { computeResultCoverage } from '@/shared/resultCoverage'
import { rulesInventory } from '@/rules/inventory'

describe('computeResultCoverage', () => {
  it('identifies missing rules by ruleId', () => {
    const rule = rulesInventory[0]
    const results = [{ ruleId: rule.id, name: rule.name, type: 'ok', message: 'done', label: 'T' }] as any
    const summary = computeResultCoverage(results)
    expect(summary.totalRules).toBe(rulesInventory.length)
    expect(summary.coveredRules).toBe(1)
    expect(summary.missingRules.some((r) => r.id === rule.id)).toBe(false)
  })
})
