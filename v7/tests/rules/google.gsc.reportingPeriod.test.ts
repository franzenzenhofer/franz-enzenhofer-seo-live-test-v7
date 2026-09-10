import { describe, expect, it } from 'vitest'

import { gscRequestIssue, searchAnalyticsPeriod } from '@/rules/google/gsc/searchAnalyticsContext'

describe('Search Console reporting context', () => {
  it('uses complete Pacific dates even before midnight there at a UTC year boundary', () => {
    expect(searchAnalyticsPeriod(new Date('2026-01-01T02:00:00Z'))).toEqual({ startDate: '2025-10-02', endDate: '2025-12-30' })
  })
  it('marks API access failure as an incomplete check and names the response status', () => {
    const result = gscRequestIssue(403, 'Historical search impressions', 'https://example.test/', 'sc-domain:example.test')
    expect(result.type).toBe('runtime_error')
    expect(result.message).toContain('403 Forbidden')
    expect(result.details?.['nextStep']).toContain('account')
  })
})
