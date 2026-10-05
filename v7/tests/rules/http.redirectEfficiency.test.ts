import { describe, it, expect } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { redirectEfficiencyRule as rule } from '@/rules/http/redirectEfficiency'
import type { NavigationLedger } from '@/background/history/types'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const createMockPage = (headers: Record<string, string> = { 'content-type': 'text/html' }) => ({
  html: '', url: 'https://example.com', doc: new DOMParser().parseFromString('<html></html>', 'text/html'), headers,
})
const run = async (page: Record<string, unknown>, ledger?: NavigationLedger | null) =>
  enrichResult(await rule.run(page as any, { globals: { navigationLedger: ledger } }), rule, 'test')
const value = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.values.find((f) => f.key === key)?.value
const detail = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.detailValues.find((f) => f.key === key)?.value

const hop = (url: string, type: 'load' | 'http_redirect' | 'client_redirect', statusCode: number) => ({ url, timestamp: Date.now(), type, statusCode })

describe('http:redirect-efficiency rule', () => {
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

  it('returns ok for direct load with zero hops', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com', trace: [hop('https://example.com', 'load', 200)] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('ok'); expect(r.priority).toBe(900)
    expect(value(r, 'Redirect hops')).toBe(0); expect(detail(r, 'Total hops')).toBe(1)
    expect(value(r, 'Final URL')).toBe('https://example.com')
  })

  it('returns ok for a single redirect hop and reports the permanent/temporary breakdown', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com', trace: [hop('http://example.com', 'http_redirect', 301), hop('https://example.com', 'load', 200)] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('ok')
    expect(value(r, 'Redirect hops')).toBe(1)
    expect(detail(r, 'Permanent redirects')).toBe(1); expect(detail(r, 'Temporary redirects')).toBe(0)
  })

  it('reports temporary-status hops as an observed fact', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com', trace: [hop('http://example.com', 'http_redirect', 302), hop('https://example.com', 'load', 200)] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('ok'); expect(detail(r, 'Temporary redirects')).toBe(1)
  })

  it('warns when the chain has 2 or more redirect hops', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com/final', trace: [
      hop('http://example.com', 'http_redirect', 301), hop('https://example.com', 'http_redirect', 301), hop('https://example.com/final', 'load', 200),
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('warn'); expect(r.priority).toBe(200)
    expect(value(r, 'Redirect hops')).toBe(2)
  })

  it('counts client-side redirects in a multi-hop chain', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com/final', trace: [
      hop('http://example.com', 'http_redirect', 302), hop('https://example.com', 'http_redirect', 302),
      hop('https://example.com/temp', 'client_redirect', 200), hop('https://example.com/final', 'load', 200),
    ] }
    const r = await run(createMockPage(), ledger)
    expect(r.type).toBe('warn')
    expect(value(r, 'Redirect hops')).toBe(3); expect(value(r, 'HTTP redirects')).toBe(2); expect(value(r, 'Client redirects')).toBe(1); expect(detail(r, 'Temporary redirects')).toBe(2)
  })

  it('includes the full chain-fact breakdown and evidence hops', async () => {
    const ledger: NavigationLedger = { tabId: 1, currentUrl: 'https://example.com', trace: [hop('http://example.com', 'http_redirect', 301), hop('https://example.com', 'load', 200)] }
    const page = { ...createMockPage(), headerChain: [{ url: 'http://example.com', status: 301, location: 'https://example.com' }, { url: 'https://example.com', status: 200 }] }
    const r = await run(page, ledger)
    expect(value(r, 'HTTP redirects')).toBeUndefined(); expect(detail(r, 'Total hops')).toBe(2)
    expect(r.presentation?.input).toBe('Navigation events + Main-document HTTP response')
    expect(r.presentation?.evidence).toHaveLength(2)
    expect(r.details).toBeUndefined()
  })

  it('preserves all references', async () => {
    const r = await run(createMockPage(), null)
    const copy = toResultCopyPayload(r)
    for (const ref of rule.meta.references) expect(copy).toContain(ref)
  })
})
