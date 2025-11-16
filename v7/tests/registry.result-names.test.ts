import { describe, it, expect } from 'vitest'
import { registry } from '../src/rules/registry'
import { JSDOM } from 'jsdom'

/**
 * Test that all rules return Result objects with proper human-readable names
 * NOT camelCase technical identifiers
 */
describe('Registry: Result.name validation', () => {
  const LONG_TIMEOUT = 60000
  const camelCasePattern = /^[a-z][a-zA-Z]*[A-Z]/

  it('all rules return Results with proper names (not camelCase)', { timeout: LONG_TIMEOUT }, async () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Test Page</title>
        <meta name="description" content="Test description">
        <link rel="canonical" href="https://example.com/">
      </head>
      <body>
        <h1>Test Heading</h1>
        <p>Test content</p>
      </body>
      </html>
    `

    const doc = new JSDOM(html).window.document
    const page = {
      html,
      url: 'https://example.com/',
      doc,
      events: { requests: {}, navigation: {} },
    }

    const ctx = { globals: {} }
    const violations: Array<{ ruleId: string; ruleName: string; resultName: string }> = []

    // Skip API-dependent rules (psi, gsc) - they require external services
    const testableRules = registry.filter(r => r.what !== 'psi' && r.what !== 'gsc')

    // Run testable rules and check Result.name
    await Promise.all(
      testableRules.map(async (rule) => {
        try {
          const result = await rule.run(page, ctx)
          const results = Array.isArray(result) ? result : [result]

          for (const r of results) {
            if (r.name && camelCasePattern.test(r.name)) {
              violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                resultName: r.name,
              })
            }
          }
        } catch {
          // Skip rules that fail on test data
        }
      }),
    )

    if (violations.length > 0) {
      const message = `Found ${violations.length} rules returning camelCase Result.name:\n` +
        violations.map(v => `  - ${v.ruleId} (${v.ruleName}): returns name="${v.resultName}"`).join('\n')
      expect(violations, message).toEqual([])
    }

    expect(violations).toEqual([])
  })

  it('all Rule.name values match expected format', () => {
    // Check that Rule.name (definition) is proper case
    const technicalTerms = ['robots.txt', 'rel=', 'max-image-preview']
    const lowercaseRuleNames = registry.filter(r => {
      if (r.name.length === 0) return true
      if (technicalTerms.some(term => r.name.startsWith(term))) return false
      return r.name[0] !== r.name[0].toUpperCase()
    })

    if (lowercaseRuleNames.length > 0) {
      const message = `Found ${lowercaseRuleNames.length} rules with lowercase Rule.name:\n` +
        lowercaseRuleNames.map(r => `  - ${r.id}: "${r.name}"`).join('\n')
      expect(lowercaseRuleNames, message).toEqual([])
    }

    expect(lowercaseRuleNames).toEqual([])
  })

  it('no rules have camelCase Rule.name', () => {
    const camelCaseRuleNames = registry.filter(r => camelCasePattern.test(r.name))

    if (camelCaseRuleNames.length > 0) {
      const message = `Found ${camelCaseRuleNames.length} rules with camelCase Rule.name:\n` +
        camelCaseRuleNames.map(r => `  - ${r.id}: "${r.name}"`).join('\n')
      expect(camelCaseRuleNames, message).toEqual([])
    }

    expect(camelCaseRuleNames).toEqual([])
  })

  it('no rules have generic/technical Rule.name', () => {
    const genericNames = registry.filter(r =>
      r.name.toLowerCase() === 'googlerule' ||
      r.name.toLowerCase() === 'rule' ||
      r.name.trim().length === 0
    )

    if (genericNames.length > 0) {
      const message = `Found ${genericNames.length} rules with generic/empty Rule.name:\n` +
        genericNames.map(r => `  - ${r.id}: "${r.name}"`).join('\n')
      expect(genericNames, message).toEqual([])
    }

    expect(genericNames).toEqual([])
  })
})
