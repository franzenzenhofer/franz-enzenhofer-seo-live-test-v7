import { afterEach, describe, expect, it, vi } from 'vitest'

import { hreflangMultipageRule } from '@/rules/head/hreflangMultipage'

const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
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

  it('probes all nine targets - far past any five-target sample', async () => {
    const fetched: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      fetched.push(url)
      return response(url, targetHtml(url))
    }))
    const r = await hreflangMultipageRule.run({ html: '', url: CANONICAL, doc: doc(pageHtml) } as never, { globals: {} })
    expect(new Set(fetched).size).toBe(9)
    expect(r.details?.['targetCount']).toBe(9)
    expect(r.details?.['checkedCount']).toBe(9)
    expect(r.details?.['sampling']).toBe('none')
    expect(r.type).toBe('info')
    expect(r.message).toContain('All 9 distinct remote hreflang targets')
  })

  it('fetches a duplicated target URL only once but keeps both declarations', async () => {
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
    const r = await hreflangMultipageRule.run({ html: '', url: CANONICAL, doc: doc(html) } as never, { globals: {} })
    expect(fetched.filter((u) => u === 'https://ex.test/de')).toHaveLength(1)
    expect(r.details?.['declarationCount']).toBe(3)
    expect(r.details?.['targetCount']).toBe(1)
    const checked = r.details?.['checked'] as Array<{ declarations: string[] }>
    expect(checked[0]?.declarations).toEqual(['de', 'de-at'])
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
    const r = await hreflangMultipageRule.run({ html: '', url: CANONICAL, doc: doc(html) } as never, { globals: {} })
    const checked = r.details?.['checked'] as Array<{ hreflang: string; status?: number; issues: string[] }>
    expect(checked).toHaveLength(2)
    expect(checked.find((c) => c.hreflang === 'de')?.status).toBe(404)
    // The valid target still got its full verdict.
    expect(checked.find((c) => c.hreflang === 'fr')?.issues).toEqual([])
    expect(r.message).toContain('HTTP 404')
    expect(r.details?.['malformed']).toEqual([{ hreflang: 'es', href: 'mailto:hola@ex.test' }])
  })
})
