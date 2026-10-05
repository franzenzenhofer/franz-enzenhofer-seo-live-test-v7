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
    expect(r.presentation?.input).toBe('Page URL'); expect(value(r, 'Current page URL')).toBe('Invalid URL')
  })

  it('reports not-applicable info for the root path', async () => {
    const r = await run('https://ex.com/')
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(r.presentation?.values).toEqual([{ key: 'Current page URL', value: 'https://ex.com/', kind: 'url' }, { key: 'Path', value: 'Root (/)', kind: 'text' }])
  })

  it('reports ok when variant canonical points back to original', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 200, body: '<link rel="canonical" href="https://ex.com/a">' } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('info'); expect(r.priority).toBe(850)
    expect(r.presentation?.values.map((f) => [f.key, f.value])).toEqual([
      ['Variant URL', 'https://ex.com/a/'], ['Current page URL', 'https://ex.com/a'], ['Variant status', 'HTTP 200 OK'],
      ['Canonical URL', 'https://ex.com/a'], ['Comparison', 'Equals current page URL'], ['<link rel="canonical">', '<link rel="canonical" href="https://ex.com/a">'],
    ])
    expect(r.presentation?.markup).toHaveLength(1)
    expect(r.presentation?.evidence.map((record) => record.name)).toEqual(['Hop 1', '<link rel="canonical">'])
    expect(r.presentation?.input).toBe('Page URL + Probed alternate URL response')
  })

  it('reports ok with the full hop chain as evidence when the variant redirects back to the original', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 301, location: 'https://ex.com/a' }, 'https://ex.com/a': { status: 200 } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('info'); expect(r.priority).toBe(800)
    expect(value(r, 'Final URL')).toBe('https://ex.com/a'); expect(value(r, 'Comparison')).toBe('Equals current page URL')
    expect(value(r, 'Final status')).toBe('HTTP 200 OK')
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
    expect(value(r, 'Final URL')).toBe('https://other.com/'); expect(value(r, 'Comparison')).toBe('Differs from current page URL (host)')
  })

  it('treats a 410 variant like 404 - info, no duplicate-content variant', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 410 } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('info'); expect(r.priority).toBe(800)
    expect(value(r, 'Variant status')).toBe('HTTP 410 Gone'); expect(value(r, 'Variant URL')).toBe('https://ex.com/a/')
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
    expect(value(r, 'Canonical link')).toBe('Not found')
  })

  it('errors on an invalid canonical href in the variant', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 200, body: '<link rel="canonical" href="http://[::not-valid">' } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('error'); expect(r.priority).toBe(140)
    expect(value(r, 'Canonical href')).toBe('http://[::not-valid'); expect(value(r, 'Comparison')).toBe('Not comparable, invalid URL')
  })

  it('errors when the variant canonical points elsewhere', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 200, body: '<link rel="canonical" href="https://ex.com/other">' } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('error'); expect(r.priority).toBe(130)
    expect(value(r, 'Canonical URL')).toBe('https://ex.com/other'); expect(value(r, 'Comparison')).toBe('Differs from current page URL (path)')
  })

  it('warns when the variant canonical is self-referential', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 200, body: '<link rel="canonical" href="https://ex.com/a/">' } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('warn'); expect(r.priority).toBe(300)
    expect(value(r, 'Canonical URL')).toBe('https://ex.com/a/'); expect(value(r, 'Comparison')).toBe('Equals variant URL')
  })

  it('errors on a redirect loop of the variant', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 301, location: 'https://ex.com/b' }, 'https://ex.com/b': { status: 301, location: 'https://ex.com/a/' } }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('error'); expect(r.priority).toBe(110)
    expect(value(r, 'Redirect chain')).toBe('Loop')
  })

  it('reports runtime_error when the probe itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))
    const r = await run('https://ex.com/a')
    expect(r.type).toBe('runtime_error'); expect(r.priority).toBe(10)
    expect(value(r, 'Request')).toBe('Failed'); expect(value(r, 'Error')).toBe('network down')
    expect(r.presentation?.input).toBe('Page URL')
  })

  it('preserves all references', async () => {
    vi.stubGlobal('fetch', scriptFetch({ 'https://ex.com/a/': { status: 410 } }))
    const r = await run('https://ex.com/a')
    const copy = toResultCopyPayload(r)
    for (const ref of rule.meta.references) expect(copy).toContain(ref)
  })
})
