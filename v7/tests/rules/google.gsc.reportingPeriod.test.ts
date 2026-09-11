import { describe, expect, it } from 'vitest'

import { searchAnalyticsPeriod } from '@/rules/google/gsc/searchAnalyticsContext'
import { gscApiIssueFacts } from '@/rules/google/gsc/gscFacts'

describe('Search Console reporting context', () => {
  it('uses complete Pacific dates even before midnight there at a UTC year boundary', () => {
    expect(searchAnalyticsPeriod(new Date('2026-01-01T02:00:00Z'))).toEqual({ startDate: '2025-10-02', endDate: '2025-12-30' })
  })
  it('marks API access failure as an incomplete check and names the response status', () => {
    const facts = gscApiIssueFacts('Search Console searchAnalytics.query (page filter)', 403, 'sc-domain:example.test', 'domain')
    expect(facts.type).toBe('runtime_error')
    expect(facts.priority).toBe(-1000)
    expect(facts.values[0]?.value).toContain('403 Forbidden')
  })
})
