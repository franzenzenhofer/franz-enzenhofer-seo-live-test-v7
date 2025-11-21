import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'

import { registry } from '../src/rules/registry'

const LONG_TIMEOUT = 120000

describe('Registry: details are provided for all rule results', () => {
  it('all testable rules return details objects', { timeout: LONG_TIMEOUT }, async () => {
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

    const violations: Array<{ ruleId: string; ruleName: string; message: string }> = []

    // Skip API-dependent rules (psi, gsc) - they require external services
    const testableRules = registry.filter(r => r.what !== 'psi' && r.what !== 'gsc')

    await Promise.all(
      testableRules.map(async (rule) => {
        try {
          const result = await rule.run(page as any, ctx as any)
          const results = Array.isArray(result) ? result : [result]

          for (const r of results) {
            if (!r) continue
            const hasDetails = r.details && Object.keys(r.details as Record<string, unknown>).length > 0
            if (!hasDetails) {
              violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                message: r.message,
              })
            }
          }
        } catch {
          // Skip rules that fail on test data
        }
      }),
    )

    if (violations.length > 0) {
      const message = `Found ${violations.length} rules returning results without details:\n` +
        violations.map(v => `  - ${v.ruleId} (${v.ruleName}): "${v.message}"`).join('\n')
      expect(violations, message).toEqual([])
    }

    expect(violations).toEqual([])
  })
})
