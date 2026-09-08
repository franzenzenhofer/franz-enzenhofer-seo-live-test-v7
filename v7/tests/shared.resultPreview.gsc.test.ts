import { describe, it, expect } from 'vitest'

import { resultPreview, resultValue } from '@/shared/resultPreview'
import {
  impressionsValue, inspectionValue, searchAnalyticsValue, topQueriesValue, totalsOf,
} from '@/rules/google/gsc/gscValue'

describe('resultPreview with Search Console details', () => {
  it('never surfaces the property, its type or the siteUrl', () => {
    const details = {
      url: 'https://fullstackoptimization.com/',
      property: 'sc-domain:fullstackoptimization.com',
      propertyType: 'domain',
      siteUrl: 'sc-domain:fullstackoptimization.com',
    }
    expect(resultPreview(details)).toBe('')
    expect(resultValue(details)).toBe('')
  })

  it('shows the judged value the rule supplies instead of the property', () => {
    const details = {
      url: 'https://fullstackoptimization.com/',
      value: '10664 impressions, 571 clicks',
      property: 'sc-domain:fullstackoptimization.com',
      propertyType: 'domain',
      impressions: 10664,
      clicks: 571,
      apiResponse: { rows: [] },
    }
    expect(resultPreview(details)).toBe('10664 impressions, 571 clicks')
  })

  it('keeps the property readable when the property itself is the finding', () => {
    expect(resultPreview({ url: 'https://x.test/', value: 'sc-domain:x.test', property: 'sc-domain:x.test' }))
      .toBe('sc-domain:x.test')
  })
})

describe('gscValue formatters', () => {
  it('sums an aggregate Search Analytics answer', () => {
    expect(totalsOf([{ impressions: 10000, clicks: 500 }, { impressions: 664, clicks: 71 }]))
      .toEqual({ impressions: 10664, clicks: 571 })
    expect(totalsOf(undefined)).toEqual({ impressions: 0, clicks: 0 })
  })

  it('formats impressions and clicks', () => {
    expect(searchAnalyticsValue(10664, 571)).toBe('10664 impressions, 571 clicks')
    expect(impressionsValue(0)).toBe('0 impressions')
  })

  it('formats the top queries with their impressions', () => {
    const rows = [
      { keys: ['franz enzenhofer', 'https://x.test/'], impressions: 961 },
      { keys: ['full stack optimization', 'https://x.test/'], impressions: 1080 },
    ]
    expect(topQueriesValue(rows)).toBe('franz enzenhofer (961), full stack optimization (1080)')
    expect(topQueriesValue([])).toBe('')
  })

  it('formats the inspection verdict with the last crawl', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(inspectionValue('Submitted and indexed', 'PASS', threeDaysAgo))
      .toBe('Submitted and indexed (PASS), last crawled 3 days ago')
    expect(inspectionValue('Unknown coverage', 'NEUTRAL', null)).toBe('Unknown coverage (NEUTRAL)')
  })
})
