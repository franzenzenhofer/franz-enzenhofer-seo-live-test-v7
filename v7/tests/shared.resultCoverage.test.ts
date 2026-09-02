import { describe, expect, it } from 'vitest'

import { computeResultCoverage } from '@/shared/resultCoverage'
import { isDebugRuleId } from '@/rules/debugRules'
import { rulesInventory } from '@/rules/inventory'

const debugRuleCount = rulesInventory.filter((r) => isDebugRuleId(r.id)).length

describe('computeResultCoverage', () => {
  it('identifies missing rules by ruleId', () => {
    const rule = rulesInventory.find((r) => !isDebugRuleId(r.id))!
    const results = [{ ruleId: rule.id, name: rule.name, type: 'ok', message: 'done', label: 'T' }] as any
    const summary = computeResultCoverage(results)
    expect(summary.totalRules).toBe(rulesInventory.length - debugRuleCount)
    expect(summary.coveredRules).toBe(1)
    expect(summary.missingRules.some((r) => r.id === rule.id)).toBe(false)
  })

  it('never reports debug rules as missing', () => {
    const summary = computeResultCoverage([])
    expect(summary.missingRules.some((r) => isDebugRuleId(r.id))).toBe(false)
    expect(summary.totalRules).toBe(rulesInventory.length - debugRuleCount)
  })

  it('counts debug rules when they actually ran', () => {
    const results = [{ ruleId: 'debug:page-object', name: 'Page object snapshot', type: 'info', message: 'x', label: 'DEBUG' }] as any
    const summary = computeResultCoverage(results)
    expect(summary.totalRules).toBe(rulesInventory.length - debugRuleCount + 1)
    expect(summary.missingRules.some((r) => isDebugRuleId(r.id))).toBe(false)
  })
})
