import { describe, expect, it, vi } from 'vitest'

import { xCacheRule } from '@/rules/http/xCache'
import { negotiatedProtocolRule } from '@/rules/http/negotiatedProtocol'
import { fromCacheRule } from '@/rules/http/fromCache'
import { soft404Rule } from '@/rules/http/soft404'
import { gzipRule } from '@/rules/http/gzip'
import { blockingScriptsRule } from '@/rules/speed/blockingScripts'
import { linkPreloadRule } from '@/rules/speed/linkPreload'
import { schemaOrganizationRule } from '@/rules/schema/organization'
import { schemaArticlePresentRule } from '@/rules/schema/articlePresent'
import { psiScoreVerdict } from '@/rules/google/psi/summary'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const page = (html: string, extra: Record<string, unknown> = {}) =>
  ({ html, url: 'https://ex.com/a', doc: doc(html), ...extra }) as never
const ctx = { globals: {} }

describe('result types and priorities match the finding', () => {
  it('http:x-cache uses cacheStatus, not a fake HTTP status key', async () => {
    const res = await xCacheRule.run(page('', { headers: { 'x-cache': 'HIT from edge' } }), ctx)
    expect(res.details?.['cacheStatus']).toBe('HIT')
    expect(res.details?.['status']).toBeUndefined()
  })

  it('http:negotiated-protocol treats h2 as a passing state', async () => {
    const res = await negotiatedProtocolRule.run(
      page('', { headers: { a: '1' }, navigationTiming: { nextHopProtocol: 'h2' } }),
      ctx,
    )
    expect(res.type).toBe('ok')
  })

  it('http:from-cache cache warning sorts near the top', async () => {
    const res = await fromCacheRule.run(page('', { headers: { a: '1' }, fromCache: true }), ctx)
    expect(res.type).toBe('warn')
    expect(res.priority).toBeLessThanOrEqual(400)
  })

  it('soft-404 redirect-to-404 is a warn, not an error', async () => {
    const orig = globalThis.fetch
    // @ts-expect-error stub network
    globalThis.fetch = vi.fn().mockResolvedValue({ status: 404, redirected: true, url: 'https://ex.com/404', body: null })
    const res = await soft404Rule.run(page('', { headers: { a: '1' } }), ctx)
    globalThis.fetch = orig
    expect(res.type).toBe('warn')
  })

  it('missing compression is a warn, not an error', async () => {
    const res = await gzipRule.run(
      page('<html></html>', { headers: { 'content-type': 'text/html' }, headerSource: 'probe' }),
      ctx,
    )
    expect(res.type).toBe('warn')
  })

  it('speed rules carry explicit priorities', async () => {
    const blocking = await blockingScriptsRule.run(page('<head><script src="a.js"></script></head>'), ctx)
    expect(blocking.type).toBe('warn')
    expect(typeof blocking.priority).toBe('number')
    const preload = await linkPreloadRule.run(page(''), ctx)
    expect(typeof preload.priority).toBe('number')
  })

  it('schema rules carry priorities and name specific missing fields', async () => {
    const html = '<script type="application/ld+json">{"@type":"Organization","name":"ACME"}</script>'
    const res = await schemaOrganizationRule.run(page(html), ctx)
    expect(res.type).toBe('warn')
    expect(typeof res.priority).toBe('number')
    expect(res.message).toMatch(/logo|url/)
    const absent = await schemaArticlePresentRule.run(page(''), ctx)
    expect(typeof absent.priority).toBe('number')
    expect(absent.message).not.toContain('‑')
  })

  it('PSI verdict follows Lighthouse score buckets', () => {
    expect(psiScoreVerdict(95).type).toBe('ok')
    expect(psiScoreVerdict(70).type).toBe('warn')
    expect(psiScoreVerdict(42).type).toBe('error')
  })
})
