import { afterEach, describe, it, expect, vi } from 'vitest'

import { scriptFetch } from '../helpers/redirectFetch'

import { enrichResult } from '@/core/runHelpers'
import { trailingSlashRule as rule } from '@/rules/url/trailingSlash'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (url: string, html = '<html></html>') => enrichResult(await rule.run({ html, url, doc: D(html) } as any, { globals: {} }), rule, 'test')
const value = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.values.find((f) => f.key === key)?.value

describe('rule: trailing slash', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports runtime_error on an unparseable page URL', async () => {
    const r = await run('not a url')
    expect(r.type).toBe('runtime_error'); expect(r.priority).toBe(50)
    expect(r.presentation?.input).toBe('Page URL')
  })

  it('reports not-applicable info for the root path', async () => {
    const r = await run('https://ex.com/')
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
  })

  it('reports ok when variant canonical points back to original', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 200, body: '<link rel="canonical" href="https://ex.com/a">' } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('info'); expect(r.priority).toBe(850)
    expect(value(r, 'Canonical target')).toBe('Original version')
    expect(r.presentation?.markup).toHaveLength(1)
    expect(r.presentation?.input).toBe('Page URL + Probed alternate URL response')
  })

  it('reports ok with the full hop chain as evidence when the variant redirects back to the original', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 301, location: 'https://ex.com/a' }, 'https://ex.com/a': { status: 200 } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('info'); expect(r.priority).toBe(800)
    expect(value(r, 'Redirect target')).toBe('Original version')
    const evidence = r.presentation?.evidence ?? []
    expect(evidence).toHaveLength(2)
    expect(evidence[0]?.fields.find((f) => f.key === 'Status')?.value).toBe('HTTP 301 Moved Permanently')
    expect(evidence[0]?.fields.find((f) => f.key === 'Location')?.value).toBe('https://ex.com/a')
    expect(r.details).toBeUndefined()
  })

  it('errors when variant redirects elsewhere, showing every hop', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 302, location: 'https://other.com/' }, 'https://other.com/': { status: 200 } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('error'); expect(r.priority).toBe(120)
    expect(value(r, 'Redirect target')).toBe('Unexpected URL')
  })

  it('treats a 410 variant like 404 - info, no duplicate-content variant', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 410 } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('info'); expect(r.priority).toBe(800)
    expect(value(r, 'Variant response status')).toBe('HTTP 410 Gone')
  })

  it('errors on a 5xx variant response', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 503 } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('error'); expect(r.priority).toBe(150)
  })

  it('warns on an unclassified non-200 status', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 403 } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('warn'); expect(r.priority).toBe(400)
  })

  it('warns (not errors) when the variant returns 200 without a canonical', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 200, body: '<p>duplicate</p>' } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('warn'); expect(r.priority).toBe(350)
    expect(value(r, 'Canonical declared')).toBe('No')
  })

  it('errors on an invalid canonical href in the variant', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 200, body: '<link rel="canonical" href="http://[::not-valid">' } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('error'); expect(r.priority).toBe(140)
    expect(value(r, 'Canonical href valid')).toBe('No')
  })

  it('errors when the variant canonical points elsewhere', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 200, body: '<link rel="canonical" href="https://ex.com/other">' } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('error'); expect(r.priority).toBe(130)
    expect(value(r, 'Canonical target')).toBe('Neither original nor variant')
  })

  it('warns when the variant canonical is self-referential', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 200, body: '<link rel="canonical" href="https://ex.com/a/">' } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('warn'); expect(r.priority).toBe(300)
    expect(value(r, 'Canonical target')).toBe('This variant (self-referential)')
  })

  it('errors on a redirect loop of the variant', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 301, location: 'https://ex.com/b' }, 'https://ex.com/b': { status: 301, location: 'https://ex.com/a/' } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('error'); expect(r.priority).toBe(110)
    expect(value(r, 'Redirect loop detected')).toBe('Yes')
  })

  it('reports runtime_error when the probe itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('runtime_error'); expect(r.priority).toBe(10)
    expect(String(value(r, 'Probe failed'))).toContain('network down')
    expect(r.presentation?.input).toBe('Page URL')
  })

  it('preserves all references', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 410 } }))
    const r = await run('https://ex.com/a')
    const copy = toResultCopyPayload(r)
    for (const ref of rule.meta.references) expect(copy).toContain(ref)
  })
})
