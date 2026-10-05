import { afterEach, describe, expect, it, vi } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { hreflangMultipageRule as rule } from '@/rules/head/hreflangMultipage'

const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const run = async (html: string, url: string) => enrichResult(await rule.run({ html: '', url, doc: doc(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value
const record = (result: Awaited<ReturnType<typeof run>>, hreflang: string) => result.presentation?.evidence.find((entry) => entry.name === `<link hreflang="${hreflang}">`)
const field = (result: Awaited<ReturnType<typeof run>>, hreflang: string, key: string) => record(result, hreflang)?.fields.find((entry) => entry.key === key)?.value
const CANONICAL = 'https://ex.test/en'

const targetHtml = (self: string, extra = `<link rel="alternate" hreflang="en" href="${CANONICAL}">`) =>
  `<head><link rel="canonical" href="${self}"><link rel="alternate" hreflang="x" href="${self}">${extra}</head>`

const response = (url: string, body: string, status = 200) => ({
  status, type: 'basic', url, redirected: false,
  headers: new Headers({ 'content-type': 'text/html' }),
  body: { cancel: vi.fn().mockResolvedValue(undefined) },
  text: async () => body,
}) as unknown as Response

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('hreflang checks every declared target', () => {
  const declarations = Array.from({ length: 9 }, (_, i) => `l${i}`)
  const pageHtml = `<head><link rel="canonical" href="${CANONICAL}">`
    + `<link rel="alternate" hreflang="en" href="${CANONICAL}">`
    + declarations.map((lang) => `<link rel="alternate" hreflang="${lang}" href="https://ex.test/${lang}">`).join('')
    + '</head>'

  it('probes all nine targets - far past any five-target sample - and ships one record per link', async () => {
    const fetched: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      fetched.push(url)
      return response(url, targetHtml(url))
    }))
    const r = await run(pageHtml, CANONICAL)
    expect(new Set(fetched).size).toBe(9)
    expect(value(r, 'Targets checked')).toBe(9)
    expect(value(r, 'Hreflang links')).toBe(10)
    expect(value(r, 'Self hreflang')).toBe('en')
    expect(r.presentation?.evidence).toHaveLength(10)
    expect(r.presentation?.evidence.filter((entry) => entry.fields.some(({ key }) => key === 'Status'))).toHaveLength(9)
    expect(field(r, 'en', 'Target')).toBe('Self, not fetched')
    expect(field(r, 'l3', 'Status')).toBe('HTTP 200 OK')
    expect(field(r, 'l3', 'Self reference')).toBe('Found')
    expect(field(r, 'l3', 'Back reference')).toBe('Found')
    expect(field(r, 'l3', 'Target canonical')).toBe('https://ex.test/l3')
    expect(field(r, 'l3', 'noindex')).toBe('Not found')
    expect(field(r, 'l3', 'Issues')).toBe(0)
    expect(r.presentation?.checked).toContainEqual({ key: 'Target sampling', value: 'None - every distinct declared target is checked', kind: 'text' })
    expect(r.type).toBe('info')
    expect(value(r, 'Issues found')).toBe(0)
    expect(detail(r, 'Markup retained')).toBe(10); expect(detail(r, 'Evidence retained')).toBe(10)
  })

  it('fetches a duplicated target URL only once but keeps both declarations as their own records', async () => {
    const html = `<head><link rel="canonical" href="${CANONICAL}">`
      + `<link rel="alternate" hreflang="en" href="${CANONICAL}">`
      + '<link rel="alternate" hreflang="de" href="https://ex.test/de">'
      + '<link rel="alternate" hreflang="de-at" href="https://ex.test/de"></head>'
    const fetched: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      fetched.push(url)
      return response(url, targetHtml(url))
    }))
    const r = await run(html, CANONICAL)
    expect(fetched.filter((u) => u === 'https://ex.test/de')).toHaveLength(1)
    expect(value(r, 'Hreflang links')).toBe(3)
    expect(value(r, 'Targets checked')).toBe(1)
    expect(field(r, 'de', 'Status')).toBe('HTTP 200 OK')
    expect(field(r, 'de-at', 'Status')).toBe('HTTP 200 OK')
  })

  it('reports a failing target without cancelling the valid ones', async () => {
    const html = `<head><link rel="canonical" href="${CANONICAL}">`
      + `<link rel="alternate" hreflang="en" href="${CANONICAL}">`
      + '<link rel="alternate" hreflang="de" href="https://ex.test/de">'
      + '<link rel="alternate" hreflang="fr" href="https://ex.test/fr">'
      + '<link rel="alternate" hreflang="es" href="mailto:hola@ex.test"></head>'
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/de')) return response(url, '', 404)
      return response(url, targetHtml(url))
    }))
    const r = await run(html, CANONICAL)
    expect(value(r, 'Targets checked')).toBe(2)
    expect(field(r, 'de', 'Status')).toBe('HTTP 404 Not Found')
    expect(field(r, 'de', 'Self reference')).toBe('Not checked')
    expect(field(r, 'de', 'Issues')).toBe(1)
    expect(field(r, 'fr', 'Issues')).toBe(0)
    expect(field(r, 'es', 'Target')).toBe('Invalid URL')
    expect(record(r, 'es')?.fields).toContainEqual({ key: 'href', value: 'mailto:hola@ex.test', kind: 'text' })
    expect(r.type).toBe('error')
    expect(detail(r, 'Malformed targets')).toBe(1)
  })
})
