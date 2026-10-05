import { afterEach, describe, expect, it, vi } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { hreflangMultipageRule as rule } from '@/rules/head/hreflangMultipage'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string, url = 'https://example.com/page') => enrichResult(await rule.run({ html, url, doc: doc(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const linkField = (result: Awaited<ReturnType<typeof run>>, hreflang: string, key: string) =>
  result.presentation?.evidence.find((record) => record.name === `<link hreflang="${hreflang}">`)?.fields.find((field) => field.key === key)

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('rule: hreflang multipage', () => {
  it('returns info when no links', async () => {
    const r = await run('<head></head>')
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(value(r, 'Hreflang links')).toBe(0)
    expect(r.presentation?.markup).toEqual([])
  })

  it('warns when an alternate URL redirects, with the status chain and the final URL as facts on the link record', async () => {
    const pageHtml = `
      <link rel="canonical" href="https://example.com/page">
      <link rel="alternate" hreflang="en" href="https://example.com/page">
      <link rel="alternate" hreflang="de" href="https://example.com/de">
    `
    const body = `
      <link rel="alternate" hreflang="de" href="https://example.com/de">
      <link rel="alternate" hreflang="en" href="https://example.com/page">
    `
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === 'https://example.com/de') {
        return { status: 301, type: 'basic', url, headers: new Headers({ location: 'https://example.com/de-final' }) } as any
      }
      return { status: 200, type: 'basic', url, headers: new Headers(), text: async () => body } as any
    }))
    const r = await run(pageHtml, 'https://example.com/page')
    expect(r.type).toBe('warn'); expect(r.priority).toBe(200)
    expect(value(r, 'Canonical URL')).toBe('https://example.com/page')
    expect(value(r, 'Issues found')).toBe(1)
    expect(linkField(r, 'de', 'Redirects')).toEqual({ key: 'Redirects', value: 1, kind: 'text' })
    expect(linkField(r, 'de', 'Status chain')).toEqual({ key: 'Status chain', value: '301 > 200', kind: 'text' })
    expect(linkField(r, 'de', 'Final URL')).toEqual({ key: 'Final URL', value: 'https://example.com/de-final', kind: 'url' })
    expect(linkField(r, 'de', 'Issues')).toEqual({ key: 'Issues', value: 1, kind: 'text' })
    // No text field anywhere embeds a URL (F9): the chain is status codes, the URLs are url fields.
    expect(r.presentation?.evidence.flatMap((record) => record.fields).every((field) => field.kind !== 'text' || !/https?:\/\//.test(String(field.value)))).toBe(true)
    expect(r.details).toBeUndefined()
    expect(toResultCopyPayload(r)).toContain(rule.meta.references[0])
  })

  it('accepts equivalent (not byte-identical) URLs: relative hrefs and host casing on the target', async () => {
    const pageHtml = `
      <link rel="canonical" href="https://example.com/page">
      <link rel="alternate" hreflang="en" href="https://example.com/page">
      <link rel="alternate" hreflang="de" href="https://example.com/de">
    `
    // Target lists itself relatively and the back reference with an uppercase
    // host: the same URLs per RFC 3986 normalization, so both must match.
    const fetchedBody = `
      <link rel="alternate" hreflang="de" href="/de">
      <link rel="alternate" hreflang="en" href="https://EXAMPLE.com/page">
    `
    vi.stubGlobal('fetch', vi.fn(async () => ({
      redirected: false,
      status: 200,
      url: 'https://example.com/de',
      type: 'basic',
      headers: new Headers(),
      text: async () => fetchedBody,
    } as any)))
    const r = await run(pageHtml, 'https://example.com/page')
    expect(r.type).toBe('info')
    expect(value(r, 'Issues found')).toBe(0)
  })

  it('passes when back-reference and self-reference exist', async () => {
    const pageHtml = `
      <link rel="canonical" href="https://example.com/page">
      <link rel="alternate" hreflang="en" href="https://example.com/page">
      <link rel="alternate" hreflang="de" href="https://example.com/de">
    `
    const fetchedBody = `
      <link rel="alternate" hreflang="de" href="https://example.com/de">
      <link rel="alternate" hreflang="en" href="https://example.com/page">
    `
    vi.stubGlobal('fetch', vi.fn(async () => ({
      redirected: false,
      status: 200,
      text: async () => fetchedBody,
    } as any)))
    const r = await run(pageHtml, 'https://example.com/page')
    expect(r.type).toBe('info')
  })

  it('states a failed probe as a request failure with the reason, never the probed URL in text', async () => {
    const pageHtml = '<link rel="canonical" href="https://example.com/page">'
      + '<link rel="alternate" hreflang="en" href="https://example.com/page">'
      + '<link rel="alternate" hreflang="fr" href="https://example.com/fr">'
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Network disabled in this test') }))
    const r = await run(pageHtml, 'https://example.com/page')
    expect(r.type).toBe('warn')
    expect(linkField(r, 'fr', 'Status')).toEqual({ key: 'Status', value: 'Request failed', kind: 'text' })
    expect(linkField(r, 'fr', 'Error')).toEqual({ key: 'Error', value: 'Network disabled in this test', kind: 'text' })
  })

  it('retains complete original markup for the declared hreflang links in the overview and the self hreflang', async () => {
    const pageHtml = '<link rel="canonical" href="https://example.com/page">'
      + '<link rel="alternate" hreflang="en" href="https://example.com/page">'
    const r = await run(pageHtml, 'https://example.com/page')
    expect(r.presentation?.values).toEqual([
      { key: 'Canonical URL', value: 'https://example.com/page', kind: 'url' },
      { key: 'Hreflang links', value: 1, kind: 'text' },
      { key: 'Self hreflang', value: 'en', kind: 'text' },
      { key: 'Targets checked', value: 0, kind: 'text' },
      { key: 'Issues found', value: 0, kind: 'text' },
      { key: '<link hreflang="en">', value: '<link rel="alternate" hreflang="en" href="https://example.com/page">', kind: 'original', fidelity: 'complete-original' },
    ])
    expect(r.presentation?.evidence).toEqual([{ name: '<link hreflang="en">', fields: [
      { key: 'hreflang', value: 'en', kind: 'text' }, { key: 'href', value: 'https://example.com/page', kind: 'url' },
      { key: 'Target', value: 'Self, not fetched', kind: 'text' }, { key: 'DOM path', value: expect.any(String), kind: 'path' },
    ] }])
  })
})
