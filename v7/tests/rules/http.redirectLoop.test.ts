import { describe, it, expect } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { redirectLoopRule as rule } from '@/rules/http/redirectLoop'
import type { NavigationLedger } from '@/background/history/types'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const createMockPage = (headers: Record<string, string> = { 'content-type': 'text/html' }) => ({
  html: '', url: 'https://example.com', doc: new DOMParser().parseFromString('<html></html>', 'text/html'), headers,
})
const run = async (page: Record<string, unknown>, ledger?: NavigationLedger | null) =>
  enrichResult(await rule.run(page as any, { globals: { navigationLedger: ledger } }), rule, 'test')
const value = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.values.find((f) => f.key === key)?.value

describe('http:redirect-loop rule', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await run(createMockPage({}), null)
    expect(r.type).toBe('runtime_error'); expect(r.priority).toBe(50)
    expect(r.presentation?.input).toBe('Not captured')
    expect(value(r, 'HTTP response headers')).toBe('Not captured')
  })

  it('returns info when no ledger available', async () => {
    const r = await run(createMockPage(), null)
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(value(r, 'Navigation data')).toBe('Not captured')
  })

  it('returns ok for a direct load with no redirects', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com', trace: [
      { url: 'https://example.com', timestamp: Date.now(), type: 'load', statusCode: 200 },
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('ok'); expect(r.priority).toBe(800)
    expect(value(r, 'Redirects observed')).toBe(0); expect(value(r, 'Loop detected')).toBe('No')
  })

  it('returns ok when no loops detected', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com', trace: [
      { url: 'http://example.com', timestamp: Date.now(), type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com', timestamp: Date.now(), type: 'load', statusCode: 200 },
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('ok')
    expect(value(r, 'Redirect hops checked')).toBe(1)
    expect(value(r, 'Loop detected')).toBe('No')
    expect(r.presentation?.detailValues.find((f) => f.key === 'Unique URLs visited')?.value).toBe(1)
    expect(r.presentation?.input).toBe('Navigation events')
  })

  it('adds Main-document HTTP response to input when a header chain was captured', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com', trace: [
      { url: 'http://example.com', timestamp: Date.now(), type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com', timestamp: Date.now(), type: 'load', statusCode: 200 },
    ] }
    const page = { ...createMockPage(), headerChain: [{ url: 'http://example.com', status: 301, location: 'https://example.com' }, { url: 'https://example.com', status: 200 }] }
    const r = await run(page, ledger)
    expect(r.presentation?.input).toBe('Navigation events + Main-document HTTP response')
    expect(r.presentation?.evidence).toHaveLength(2)
  })

  it('detects a simple redirect loop between two URLs', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com/a', trace: [
      { url: 'https://example.com/a', timestamp: Date.now(), type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com/b', timestamp: Date.now(), type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com/a', timestamp: Date.now(), type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com/b', timestamp: Date.now(), type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com/c', timestamp: Date.now(), type: 'load', statusCode: 200 },
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('error'); expect(r.priority).toBe(50)
    expect(value(r, 'Loop detected')).toBe('Yes'); expect(value(r, 'Looping URLs')).toBe(2)
    const loop1 = r.presentation?.evidence.find((e) => e.name === 'Loop 1')
    expect(loop1?.fields.some((f) => f.key === 'Occurrences' && f.value === 2)).toBe(true)
    expect(r.details).toBeUndefined()
  })

  it('detects a self-referential loop', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com', trace: [
      { url: 'https://example.com', timestamp: Date.now(), type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com', timestamp: Date.now(), type: 'http_redirect', statusCode: 301 },
      { url: 'https://example.com', timestamp: Date.now(), type: 'load', statusCode: 200 },
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('error'); expect(value(r, 'Looping URLs')).toBe(1)
  })

  it('preserves all references and emits no legacy details', async () => {
    const r = await run(createMockPage(), null)
    const copy = toResultCopyPayload(r)
    for (const ref of rule.meta.references) expect(copy).toContain(ref)
  })
})
