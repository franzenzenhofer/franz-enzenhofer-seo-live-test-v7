import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ResultDetails } from '@/components/result/ResultDetails'
import { toResultCopyPayload } from '@/components/result/resultCopy'
import { buildDetailPayload } from '@/components/result/resultTransforms'
import { readResourceIssues, resourceIssueCopy } from '@/shared/resourceIssues'

import type { Result } from '@/core/types'

// This shared rendering path (ResourceIssues.tsx / resourceIssueCopy) previously
// received its fixture from http:mixed-content's legacy `details.resourceIssues`.
// That rule is presentation-migrated now (no `details`), so this fixture is
// written by hand, preserving the exact fields the legacy branch used to emit,
// to keep testing the shared component's own rendering contract.
const legacyResourceIssues = [
  { name: 'Alpe-Adria 8 Tage', kind: 'Image', url: 'http://cdn.test/trip.jpg?v=1', location: '<img> src', selector: 'img[src="http://cdn.test/trip.jpg?v=1"]' },
  { name: 'app.js', kind: 'Script', url: 'http://cdn.test/app.js', location: '<script> src', selector: 'script[src="http://cdn.test/app.js"]' },
]
const legacyResult = (): Result => ({
  label: 'HTTP', name: 'Mixed content', type: 'error', priority: 80,
  message: '2 mixed-content resources use HTTP on this HTTPS page (1 image, 1 script).',
  details: {
    resourceIssues: legacyResourceIssues,
    problem: 'These HTTP URLs are errors in the site code, even when the browser automatically upgrades or blocks the requests.',
    fix: 'Update the listed URLs in your HTML, CMS content, templates or third-party configuration to HTTPS. Verify each HTTPS endpoint works; otherwise replace or remove the resource.',
    count: 2,
    reference: 'https://www.w3.org/TR/mixed-content/',
  },
})

describe('readable resource findings', () => {
  it('renders numbered named cards with copy actions, full URLs and fixes, without JSON or duplicate selectors', () => {
    const finding = legacyResult()
    const html = renderToStaticMarkup(<ResultDetails details={buildDetailPayload(finding.details)} />)
    expect(html).toContain('1. Image: Alpe-Adria 8 Tage')
    expect(html).toContain('2. Script: app.js')
    expect(html).toContain('http://cdn.test/trip.jpg?v=1')
    expect(html).toContain('Change &lt;img&gt; src to an HTTPS URL.')
    expect(html).toContain('Copy offender')
    expect(html).toContain('Copy CSS selector')
    expect(html).not.toContain('detail-evidence')
    expect(html).not.toContain('Highlight selectors')
    expect(html).not.toContain('&quot;url&quot;:')
    expect(html).not.toContain('Count:')
  })

  it('copies every offender with enough context to paste into a ticket', () => {
    const payload = toResultCopyPayload(legacyResult())
    expect(payload).toContain('#### 1. Image: Alpe-Adria 8 Tage')
    expect(payload).toContain('#### 2. Script: app\\.js')
    expect(payload).toContain('http://cdn.test/trip.jpg?v=1')
    expect(payload).toContain('img[src="http://cdn.test/trip.jpg?v=1"]')
    expect(payload).toContain('Change \\<img\\> src to an HTTPS URL\\.')
    expect(payload).toContain('https://www.w3.org/TR/mixed-content/')
    expect(payload).not.toContain('**Snippet:**')
  })

  it('treats page labels as text and keeps markdown fences intact', () => {
    const issue = { name: '<script>alert(1)</script>', kind: 'Image', url: 'http://cdn.test/```/x.jpg', location: '<img> src' }
    const html = renderToStaticMarkup(<ResultDetails details={{ resourceIssues: [issue] }} />)
    expect(html).not.toContain('<script>')
    expect(resourceIssueCopy(issue, 0)).toContain('````\nhttp://cdn.test/```/x.jpg\n````')
    expect(readResourceIssues([{ name: 'incomplete' }])).toEqual([])
  })
})
