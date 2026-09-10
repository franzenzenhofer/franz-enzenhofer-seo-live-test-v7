import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ResultDetails } from '@/components/result/ResultDetails'
import { toResultCopyPayload } from '@/components/result/resultCopy'
import { buildDetailPayload } from '@/components/result/resultTransforms'
import { mixedContentRule } from '@/rules/http/mixedContent'
import { readResourceIssues, resourceIssueCopy } from '@/shared/resourceIssues'

const result = () => mixedContentRule.run({
  html: '', url: 'https://example.test',
  doc: new DOMParser().parseFromString('<img src="http://cdn.test/trip.jpg?v=1" alt="Alpe-Adria 8 Tage"><script src="http://cdn.test/app.js"></script>', 'text/html'),
}, { globals: {} })

describe('readable resource findings', () => {
  it('renders numbered named cards with copy actions, full URLs and fixes, without JSON or duplicate selectors', async () => {
    const finding = await result()
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

  it('copies every offender with enough context to paste into a ticket', async () => {
    const payload = toResultCopyPayload(await result())
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
