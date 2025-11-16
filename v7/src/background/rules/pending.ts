import type { Result, Rule } from '@/core/types'

const labelFor = (rule: Rule) => (rule.id.split(':')[0] || 'RULE').toUpperCase()

export const buildPendingResults = (rules: Rule[]): Result[] =>
  rules.map((rule) => ({
    name: rule.name,
    label: labelFor(rule),
    message: 'Running...',
    type: 'pending',
    what: rule.what || null,
    ruleId: rule.id,
    priority: 5000,
    bestPractice: Boolean(rule.bestPractice),
  }))

export const buildRuleOverrides = (rules: Rule[]) =>
  rules.reduce<Record<string, boolean>>((acc, rule) => {
    acc[rule.id] = rule.enabled
    return acc
  }, {})
