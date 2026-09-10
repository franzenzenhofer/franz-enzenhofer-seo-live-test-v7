import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ResultDetails } from '@/components/result/ResultDetails'
import { toResultCopyPayload } from '@/components/result/resultCopy'
import { navigationPathRule } from '@/rules/http/navigationPath'
import { navigationPathSteps } from '@/rules/http/navigationPathSteps'
import type { Page } from '@/core/types'
import type { NavigationHop } from '@/background/history/types'

const start = 'https://www.example.com/g/286584'
const destination = 'https://www.example.com/g/597748'
const trace: NavigationHop[] = [
  { url: start, type: 'http_redirect', statusCode: 308, timestamp: 1 },
  { url: destination, type: 'load', statusCode: 200, timestamp: 2 },
  { url: destination, type: 'history_api', statusCode: 200, timestamp: 3 },
]
const page: Page = {
  html: '', doc: new DOMParser().parseFromString('', 'text/html'), url: destination,
  headers: { 'content-type': 'text/html' },
  headerChain: [{ url: start, status: 308, location: '/g/597748' }, { url: destination, status: 200 }],
}
const run = (input = page, hops = trace) => navigationPathRule.run(input, { globals: {
  navigationLedger: { tabId: 1, currentUrl: input.url, trace: hops },
} })

describe('navigation journey', () => {
  it('explains the reported 308, 200 and unchanged history update without duplicating the trace', async () => {
    const result = await run()
    expect(result.message).toContain('Single permanent redirect (1 hop).')
    expect(result.message).toContain('Destination returned HTTP 200 OK.')
    expect(result.message).toContain('1 browser history update added no HTTP redirects.')
    expect(result.message).not.toContain(start)
    const html = renderToStaticMarkup(<ResultDetails details={result.details} />)
    expect(html).toContain('HTTP 308 Permanent Redirect')
    expect(html).toContain('HTTP 200 OK')
    expect(html).toContain('Browser history updated')
    expect(html).toContain('The address stayed the same.')
    expect(html).toContain('preserving the request method and body')
    expect(html).toContain('Copy journey')
    expect(html.match(/data-testid="navigation-step"/g)).toHaveLength(3)
    expect(html).not.toContain('Redirect chain text')
    expect(html).not.toContain('detail-evidence')
    const copied = toResultCopyPayload(result)
    expect(copied).toContain('1. HTTP 308 Permanent Redirect')
    expect(copied).toContain(`**Destination:**\n\`\`\`\n${destination}`)
    expect(copied).toContain('2. HTTP 200 OK')
    expect(copied).toContain('3. Browser history updated')
    expect(copied).toContain('Update internal links')
  })

  it('uses captured response statuses, instead of a synthesized 200, and reports failed destinations', async () => {
    const result = await run({ ...page, headerChain: [{ url: start, status: 308, location: destination }, { url: destination, status: 404 }] })
    expect(result.type).toBe('error')
    expect(result.message).toContain('HTTP 404 Not Found')
    expect(result.message).not.toContain('HTTP 200')
  })

  it('does not invent a successful status or permanent redirect when status is missing', async () => {
    const hops: NavigationHop[] = [{ url: start, type: 'http_redirect', timestamp: 1 }, { url: destination, type: 'load', timestamp: 2 }]
    const result = await run({ ...page, headerChain: undefined }, hops)
    expect(result.message).toContain('permanence could not be confirmed')
    expect(toResultCopyPayload(result)).toContain('HTTP status not captured')
    expect(toResultCopyPayload(result)).not.toContain('HTTP 200')
  })

  it('keeps extra captured redirect hops and matches repeated URLs in order', () => {
    const steps = navigationPathSteps({ ...page, headerChain: [
      { url: start, status: 301, location: destination },
      { url: destination, status: 302, location: start },
      { url: start, status: 200 },
    ] }, [{ url: start, type: 'http_redirect', timestamp: 1 }, { url: start, type: 'load', timestamp: 3 }])
    expect(steps.map((step) => step.statusCode)).toEqual([301, 302, 200])
  })
})
