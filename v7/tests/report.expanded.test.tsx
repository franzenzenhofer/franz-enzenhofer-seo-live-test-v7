import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { ReportResultsSection } from '@/report/ReportResultsSection'
import type { Result } from '@/shared/results'

const results = [{
  name: 'Canonical Link',
  label: 'HEAD',
  message: 'Canonical self-references the current URL.',
  type: 'ok',
  priority: 850,
  ruleId: 'head-canonical',
  details: { canonicalUrl: 'https://orf.at/stories/3440788/', count: 1, reference: 'https://example.test/spec' },
}] as Result[]

describe('report view', () => {
  it('renders every card fully expanded - the report is the read-everything view', () => {
    const html = renderToStaticMarkup(<ReportResultsSection results={results} debugEnabled={false} />)
    // Expanded cards offer "Hide", collapsed ones offer "Details".
    expect(html).toContain('Hide')
    // Detail content must be present without any interaction.
    expect(html).toContain('https://orf.at/stories/3440788/')
  })
})
