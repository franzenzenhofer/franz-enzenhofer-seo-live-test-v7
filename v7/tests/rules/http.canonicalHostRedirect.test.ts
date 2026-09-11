import { describe, it, expect } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { canonicalHostRedirectRule as rule } from '@/rules/http/canonicalHostRedirect'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (page: Record<string, unknown>, ledger?: unknown) =>
  enrichResult(await rule.run(page as any, { globals: { navigationLedger: ledger } }), rule, 'test')
const value = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.values.find((f) => f.key === key)?.value
const detail = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.detailValues.find((f) => f.key === key)?.value

const page = (url: string, headers: Record<string, string> = { 'content-type': 'text/html' }, html = '<html><head></head><body></body></html>') =>
  ({ html: '', url, doc: D(html), headers })

describe('rule: www/non-www canonical redirect', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await run(page('https://example.com/', {}), null)
    expect(r.type).toBe('runtime_error'); expect(r.priority).toBe(50)
    expect(value(r, 'HTTP response headers')).toBe('Not captured')
  })

  it('returns info when no navigation data is available', async () => {
    const r = await run(page('https://example.com/'), null)
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(value(r, 'Navigation data')).toBe('Not captured')
  })

  it('warns when the first/final URL cannot be parsed', async () => {
    const ledger = { tabId: 1, currentUrl: 'not a url', trace: [{ url: 'not a url', timestamp: 1, type: 'load', statusCode: 200 }] }
    const r = await run(page('https://example.com/'), ledger)
    expect(r.type).toBe('warn'); expect(r.priority).toBe(200)
    expect(value(r, 'URL parses')).toBe('No')
  })

  it('ok on single-hop permanent www -> non-www redirect', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://example.com/page?x=1', trace: [
      { url: 'https://www.example.com/page?x=1', timestamp: 1, type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com/page?x=1', timestamp: 2, type: 'load', statusCode: 200 },
    ] }
    const r = await run(page('https://example.com/page?x=1'), ledger)
    expect(r.type).toBe('ok'); expect(r.priority).toBe(850)
    expect(value(r, 'Host changed www/non-www')).toBe('Yes')
    expect(detail(r, 'Redirect status')).toBe('HTTP 301 Moved Permanently')
  })

  it('errors on a client-side redirect used for host canonicalization', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://example.com/', trace: [
      { url: 'https://www.example.com/', timestamp: 1, type: 'client_redirect', statusCode: 200 },
      { url: 'https://example.com/', timestamp: 2, type: 'load', statusCode: 200 },
    ] }
    const r = await run(page('https://example.com/'), ledger)
    expect(r.type).toBe('error'); expect(r.priority).toBe(100)
    expect(detail(r, 'Client-side redirects')).toBe(1)
  })

  it('warns when the host changed without an observed server redirect', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://example.com/', trace: [
      { url: 'https://www.example.com/', timestamp: 1, type: 'load', statusCode: 200 },
      { url: 'https://example.com/', timestamp: 2, type: 'load', statusCode: 200 },
    ] }
    const r = await run(page('https://example.com/'), ledger)
    expect(r.type).toBe('warn'); expect(r.priority).toBe(200)
    expect(detail(r, 'Server redirects observed')).toBe(0)
  })

  it('errors on temporary www/non-www redirect', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://example.com/', trace: [
      { url: 'https://www.example.com/', timestamp: 1, type: 'http_redirect', statusCode: 302 },
      { url: 'https://example.com/', timestamp: 2, type: 'load', statusCode: 200 },
    ] }
    const r = await run(page('https://example.com/'), ledger)
    expect(r.type).toBe('error'); expect(r.priority).toBe(130)
    expect(detail(r, 'Observed redirect status')).toBe('HTTP 302 Found')
  })

  it('errors when the redirect changes path or query', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://example.com/other', trace: [
      { url: 'https://www.example.com/page', timestamp: 1, type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com/other', timestamp: 2, type: 'load', statusCode: 200 },
    ] }
    const r = await run(page('https://example.com/other'), ledger)
    expect(r.type).toBe('error'); expect(r.priority).toBe(140)
  })

  it('warns (not errors) on multi-hop permanent redirect chain', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://example.com/', trace: [
      { url: 'http://www.example.com/', timestamp: 1, type: 'http_redirect', statusCode: 301 },
      { url: 'https://www.example.com/', timestamp: 2, type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com/', timestamp: 3, type: 'load', statusCode: 200 },
    ] }
    const r = await run(page('https://example.com/'), ledger)
    expect(r.type).toBe('warn'); expect(r.priority).toBe(220)
    expect(detail(r, 'Permanent redirect hops')).toBe(2)
  })

  it('warns when canonical swaps host without redirect (canonical-only resolution)', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://www.example.com/page', trace: [
      { url: 'https://www.example.com/page', timestamp: 1, type: 'load', statusCode: 200 },
    ] }
    const r = await run(page('https://www.example.com/page', { 'content-type': 'text/html' }, '<link rel="canonical" href="https://example.com/page">'), ledger)
    expect(r.type).toBe('warn'); expect(r.priority).toBe(250)
    expect(r.presentation?.input).toContain('Static DOM')
    expect(r.presentation?.checked).toContainEqual({ key: 'Selector', value: 'link[rel~="canonical" i]', kind: 'text' })
    expect(detail(r, 'Declared canonical URL')).toBe('https://example.com/page')
  })

  it('reports info when no www/non-www redirect was observed and no host swap occurred', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://example.com/', trace: [{ url: 'https://example.com/', timestamp: 1, type: 'load', statusCode: 200 }] }
    const r = await run(page('https://example.com/'), ledger)
    expect(r.type).toBe('info'); expect(r.priority).toBe(800)
    expect(value(r, 'Host changed www/non-www')).toBe('No')
  })

  it('preserves all references and emits no legacy details', async () => {
    const r = await run(page('https://example.com/', {}), null)
    const copy = toResultCopyPayload(r)
    for (const ref of rule.meta.references) expect(copy).toContain(ref)
    expect(r.details).toBeUndefined()
  })
})
