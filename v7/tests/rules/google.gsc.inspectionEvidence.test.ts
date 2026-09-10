import { describe, expect, it } from 'vitest'

import { inspectionDetails } from '@/rules/google/gsc/inspectionData'

describe('inspection evidence', () => {
  it('names Google states and preserves every supplied sitemap and rich-result issue', () => {
    const sitemaps = Array.from({ length: 12 }, (_, i) => `https://example.test/sitemap-${i}.xml`)
    const result = inspectionDetails({ indexStatusResult: { sitemap: sitemaps, indexingState: 'BLOCKED_BY_META_TAG', pageFetchState: 'NOT_FOUND' } })
    expect(result.sitemaps).toEqual(sitemaps)
    expect(result.indexingState).toContain('noindex meta tag')
    expect(result.pageFetchState).toContain('HTTP 404 Not Found')
    expect(result.evidenceSource).toContain('recorded crawl')
  })
})
