import { describe, expect, it } from 'vitest'

import { summarizePSI } from '@/rules/google/psi/summary'
import type { PSIResult } from '@/shared/psi'

const sample: PSIResult = {
  lighthouseResult: {
    categories: { performance: { score: 0.91 } },
    audits: {
      'first-contentful-paint': { numericValue: 1012.3 },
      'largest-contentful-paint': { numericValue: 2345.7 },
      'total-blocking-time': { numericValue: 88.1 },
      'cumulative-layout-shift': { numericValue: 0.12345 },
      'speed-index': { numericValue: 1890.4 },
    },
    fetchTime: '2025-11-21T11:00:00.000Z',
    finalDisplayedUrl: 'https://final.example.com',
    runWarnings: ['first', 'second', 'third', 'fourth', 'fifth', 'ignored extra'],
    userAgent: 'Mozilla/5.0',
  },
}

describe('summarizePSI', () => {
  it('keeps only the minimal PSI fields and rounds metrics', () => {
    const summary = summarizePSI(sample, 'https://example.com', 'mobile')
    expect(summary).toEqual({
      url: 'https://example.com',
      strategy: 'mobile',
      score: 91,
      fcpMs: 1012,
      lcpMs: 2346,
      tbtMs: 88,
      speedIndexMs: 1890,
      cls: 0.123,
      fetchTime: '2025-11-21T11:00:00.000Z',
      finalDisplayedUrl: 'https://final.example.com',
      testUrl: 'https://pagespeed.web.dev/analysis?url=https%3A%2F%2Ffinal.example.com&form_factor=mobile',
      userAgent: 'Mozilla/5.0',
      warnings: ['first', 'second', 'third', 'fourth', 'fifth'],
    })
    expect(Object.keys(summary)).not.toContain('audits')
  })

  it('defaults missing metrics safely', () => {
    const summary = summarizePSI({}, 'https://example.com', 'desktop')
    expect(summary.score).toBe(0)
    expect(summary.url).toBe('https://example.com')
    expect(summary.strategy).toBe('desktop')
  })
})
