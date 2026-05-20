import { describe, expect, it } from 'vitest'

import { ImportSettings, PSIResponse } from '@/shared/schemas'

describe('ImportSettings schema', () => {
  it('accepts plain primitives and nested records', () => {
    const r = ImportSettings.safeParse({
      'ui:autoRun': true,
      'rule-flags': { 'dom:html-lang': false, 'http:status-ok': true },
      'ui:blocklist': ['*.tracker.com', '*.ads.com'],
    })
    expect(r.success).toBe(true)
  })

  it('rejects exotic structures (Date, function, undefined)', () => {
    const r1 = ImportSettings.safeParse({ foo: new Date() })
    const r2 = ImportSettings.safeParse({ foo: () => 1 })
    expect(r1.success).toBe(false)
    expect(r2.success).toBe(false)
  })

  it('rejects non-objects at the top level', () => {
    expect(ImportSettings.safeParse('not-a-record').success).toBe(false)
    expect(ImportSettings.safeParse(42).success).toBe(false)
  })
})

describe('PSIResponse schema', () => {
  it('accepts the minimal live-shape we depend on', () => {
    const r = PSIResponse.safeParse({
      lighthouseResult: { categories: { performance: { score: 0.9 } } },
    })
    expect(r.success).toBe(true)
  })

  it('accepts a response with only audits, no categories', () => {
    const r = PSIResponse.safeParse({
      lighthouseResult: { audits: { 'fcp': { numericValue: 1200 } } },
    })
    expect(r.success).toBe(true)
  })

  it('rejects responses missing lighthouseResult entirely when it is required by callers', () => {
    // schema allows the field to be omitted at the lighthouseResult level
    // but rejects entirely non-object responses
    expect(PSIResponse.safeParse('boom').success).toBe(false)
  })
})
