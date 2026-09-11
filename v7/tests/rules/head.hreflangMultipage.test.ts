import { afterEach, describe, expect, it, vi } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { hreflangMultipageRule as rule } from '@/rules/head/hreflangMultipage'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string, url = 'https://example.com/page') => enrichResult(await rule.run({ html, url, doc: doc(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value
const targetField = (result: Awaited<ReturnType<typeof run>>, targetIndex: number, key: string) =>
  result.presentation?.evidence.find((record) => record.name === `Target ${targetIndex}`)?.fields.find((field) => field.key === key)?.value

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('rule: hreflang multipage', () => {
  it('returns info when no links', async () => {
    const r = await run('<head></head>')
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(value(r, 'Hreflang targets declared')).toBe(0)
    expect(r.presentation?.markup).toEqual([])
  })

  it('warns with the full hop chain when an alternate URL redirects', async () => {
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
    expect(targetField(r, 1, 'Findings')).toContain("'de' URL redirects (1 hop) to https://example.com/de-final")
    expect(targetField(r, 1, 'Redirect chain')).toContain('HTTP 301 -> Location: https://example.com/de-final')
    expect(targetField(r, 1, 'Redirect chain')).toContain('FINAL STATUS HTTP 200')
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

  it('retains complete original markup for the declared hreflang links', async () => {
    const pageHtml = '<link rel="canonical" href="https://example.com/page">'
      + '<link rel="alternate" hreflang="en" href="https://example.com/page">'
    const r = await run(pageHtml, 'https://example.com/page')
    expect(r.presentation?.markup.map((field) => field.value)).toEqual([
      '<link rel="alternate" hreflang="en" href="https://example.com/page">',
    ])
    expect(detail(r, 'Self hreflang')).toBe('en')
  })
})
