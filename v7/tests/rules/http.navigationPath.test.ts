import { describe, it, expect } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { navigationPathRule as rule } from '@/rules/http/navigationPath'
import type { NavigationLedger } from '@/background/history/types'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const createMockPage = (headers: Record<string, string> = { 'content-type': 'text/html' }) => ({
  html: '', url: 'https://example.com', doc: new DOMParser().parseFromString('<html></html>', 'text/html'), headers,
})
const run = async (page: Record<string, unknown>, ledger?: NavigationLedger | null) =>
  enrichResult(await rule.run(page as any, { globals: { navigationLedger: ledger } }), rule, 'test')
const value = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.values.find((f) => f.key === key)?.value

describe('http:navigation-path rule', () => {
  it('exposes the full webRequest hop chain (URL, status, Location) as named evidence', async () => {
    const page = { ...createMockPage(), status: 200, headerChain: [
      { url: 'https://example.com/old', status: 301, redirectUrl: 'https://example.com/mid' },
      { url: 'https://example.com/mid', status: 302, redirectUrl: 'https://example.com' },
      { url: 'https://example.com', status: 200 },
    ] }
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com', trace: [
      { url: 'https://example.com/old', timestamp: 1, type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com/mid', timestamp: 2, type: 'http_redirect', statusCode: 302 },
      { url: 'https://example.com', timestamp: 3, type: 'load', statusCode: 200 },
    ] }
    const r = await run(page, ledger)
    // Googlebot follows up to 10 hops, so a chain is a crawl/performance warning, not a broken page.
    expect(r.type).toBe('warn')
    const evidence = r.presentation?.evidence ?? []
    expect(evidence).toHaveLength(3)
    expect(evidence[0]?.fields.find((f) => f.key === 'Status')?.value).toBe('HTTP 301 Moved Permanently')
    expect(evidence[0]?.fields.find((f) => f.key === 'Location')?.value).toBe('https://example.com/mid')
    expect(evidence[1]?.fields.find((f) => f.key === 'Location')?.value).toBe('https://example.com/')
    expect(evidence[2]?.fields.some((f) => f.key === 'Location')).toBe(false)
    expect(r.details).toBeUndefined()
  })

  it('returns runtime_error when headers not captured', async () => {
    const r = await run(createMockPage({}), null)
    expect(r.type).toBe('runtime_error'); expect(r.priority).toBe(50)
    expect(value(r, 'HTTP response headers')).toBe('Not captured')
  })

  it('returns info when no ledger available', async () => {
    const r = await run(createMockPage(), null)
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(value(r, 'Navigation events')).toBe('Not checked')
  })

  it('returns info when trace is empty', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com', trace: [] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(value(r, 'Navigation events')).toBe('None')
  })

  it('returns ok for direct load (no redirects)', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com', trace: [
      { url: 'https://example.com', timestamp: Date.now(), type: 'load', statusCode: 200 },
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('ok'); expect(r.priority).toBe(800)
    expect(value(r, 'Redirect hops')).toBe(0)
    expect(value(r, 'Final status')).toBe('HTTP 200 OK')
  })

  it('returns ok for a single permanent HTTP to HTTPS redirect', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com', trace: [
      { url: 'http://example.com', timestamp: Date.now(), type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com', timestamp: Date.now(), type: 'load', statusCode: 200 },
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('ok'); expect(r.priority).toBe(750)
    expect(value(r, 'Redirect hops')).toBe(1)
    expect(r.presentation?.values.slice(0, 2)).toEqual([{ key: 'First URL', value: 'http://example.com', kind: 'url' }, { key: 'Final URL', value: 'https://example.com', kind: 'url' }])
  })

  it('returns info for a generic single permanent redirect', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com/new', trace: [
      { url: 'https://example.com/old', timestamp: Date.now(), type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com/new', timestamp: Date.now(), type: 'load', statusCode: 200 },
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('info'); expect(r.priority).toBe(700)
    expect(value(r, 'Redirect hops')).toBe(1)
  })

  it.each([302, 303, 307])('returns warn for a temporary redirect (%s)', async (statusCode) => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com/new', trace: [
      { url: 'https://example.com/old', timestamp: Date.now(), type: 'http_redirect', statusCode },
      { url: 'https://example.com/new', timestamp: Date.now(), type: 'load', statusCode: 200 },
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('warn'); expect(r.priority).toBe(200)
    const codes = r.presentation?.detailValues.find((f) => f.key === 'Temporary status codes')?.value
    expect(String(codes)).toContain(String(statusCode))
  })

  it('returns error for a client-side redirect', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com/redirected', trace: [
      { url: 'https://example.com', timestamp: Date.now(), type: 'load', statusCode: 200 },
      { url: 'https://example.com/redirected', timestamp: Date.now(), type: 'client_redirect', statusCode: 200 },
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('error'); expect(r.priority).toBe(100)
    expect(value(r, 'Client redirects')).toBe(1)
  })

  it('returns warn for a redirect chain of multiple hops', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com/final', trace: [
      { url: 'http://example.com', timestamp: Date.now(), type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com', timestamp: Date.now(), type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com/final', timestamp: Date.now(), type: 'load', statusCode: 200 },
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('warn'); expect(r.priority).toBe(200)
    expect(value(r, 'Redirect hops')).toBe(2)
  })

  it('returns error when navigation ends with a server error response', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com/missing', trace: [
      { url: 'https://example.com/missing', timestamp: Date.now(), type: 'load', statusCode: 404 },
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('error'); expect(r.priority).toBe(100)
    expect(value(r, 'Final status')).toBe('HTTP 404 Not Found')
  })

  it('preserves all references and emits no legacy details', async () => {
    const r = await run(createMockPage(), null)
    const copy = toResultCopyPayload(r)
    for (const ref of rule.meta.references) expect(copy).toContain(ref)
    expect(r.details).toBeUndefined()
  })
})
