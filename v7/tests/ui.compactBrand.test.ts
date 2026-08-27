import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'

import { LiveTestHeader } from '@/components/LiveTestHeader'
import { ResultCard } from '@/components/result/ResultCard'
import { ReportResultsSection } from '@/report/ReportResultsSection'
import type { Result } from '@/shared/results'

const result: Result = {
  name: 'Compact result',
  label: 'TEST',
  message: 'Finding stays visible',
  type: 'warn',
  what: 'technical',
  priority: 42,
  ruleId: 'rule:secret-metadata',
  details: { snippet: 'private source snippet', sourceHtml: '<main>private source</main>' },
}

describe('compact branded UI', () => {
  beforeAll(() => {
    // @ts-expect-error minimal render-only Chrome shim
    globalThis.chrome = { runtime: { getURL: (path: string) => `chrome-extension://test/${path}` } }
  })

  it('uses the canonical product name in the shared header', () => {
    const html = renderToStaticMarkup(createElement(LiveTestHeader, { url: 'https://example.com' }))
    expect(html).toContain('Franz Enzenhofer SEO Live Test')
  })

  it('keeps source and technical metadata behind Details', () => {
    const collapsed = renderToStaticMarkup(createElement(ResultCard, { result }))
    const expanded = renderToStaticMarkup(createElement(ResultCard, { result, defaultExpanded: true }))

    expect(collapsed).toContain('Finding stays visible')
    expect(collapsed).toContain('Details')
    expect(collapsed).not.toContain('private source snippet')
    expect(collapsed).not.toContain('rule:secret-metadata')
    expect(expanded).toContain('private source snippet')
    expect(expanded).toContain('rule:secret-metadata')
  })

  it('collapses report result cards and default diagnostics', () => {
    const html = renderToStaticMarkup(createElement(ReportResultsSection, { results: [result], debugEnabled: false }))

    expect(html).not.toContain('private source snippet')
    expect(html).not.toContain('Coverage')
    expect(html).not.toContain('Filter tips')
    expect(html).not.toContain('Showing 1 of 1')
  })
})
