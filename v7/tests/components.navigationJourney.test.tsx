import { describe, expect, it } from 'vitest'

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
    expect(result.type).toBe('info'); expect(result.priority).toBe(700)
    expect(result.message).not.toContain(start)
    const hops = result.presentation?.evidence ?? []
    expect(hops.map((hop) => hop.fields.find((field) => field.key === 'Status')?.value)).toEqual(['HTTP 308 Permanent Redirect', 'HTTP 200 OK', undefined])
    expect(hops[0]?.fields).toContainEqual({ key: 'Location', value: destination, kind: 'url' })
    expect(hops[2]?.fields).toContainEqual({ key: 'Event type', value: 'Browser history updated', kind: 'text' })
    const copied = toResultCopyPayload(result)
    expect(copied).toContain('Status: HTTP 308 Permanent Redirect')
    expect(copied).toContain('Status: HTTP 200 OK')
    expect(copied).not.toContain('Update internal links')
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
    expect(result.type).toBe('info'); expect(result.priority).toBe(700)
    expect(result.presentation?.values).toContainEqual({ key: 'Final response status', value: 'Not captured', kind: 'text' })
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
