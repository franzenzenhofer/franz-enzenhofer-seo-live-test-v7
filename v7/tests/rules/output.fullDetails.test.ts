import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { boundDetails } from '@/shared/boundResult'
import { mixedContentRule } from '@/rules/http/mixedContent'
import { robotsBlockedResourcesRule } from '@/rules/robots/blockedResources'
import { pageObjectRule } from '@/rules/debug/pageObject'
import { summarizePSI } from '@/rules/google/psi/summary'
import { hreflangRule } from '@/rules/head/hreflang'
import { parameterizedLinksRule } from '@/rules/body/parameterizedLinks'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const page = (html: string, extra: Record<string, unknown> = {}) =>
  ({ html, url: 'https://ex.com/a', doc: doc(html), ...extra }) as never
const ctx = { globals: {} }

let origFetch: typeof globalThis.fetch
beforeEach(() => { origFetch = globalThis.fetch })
afterEach(() => { globalThis.fetch = origFetch })

describe('details carry everything collected (no silent discarding)', () => {
  it('transport keeps a cheap 50-item array intact within the byte budget', () => {
    const details = boundDetails({ urls: Array.from({ length: 50 }, (_, i) => `https://ex.com/r${i}.js`) })
    expect((details['urls'] as unknown[]).length).toBe(50)
    expect(details['evidenceBounds']).toBeUndefined()
  })

  it('transport marks cut strings instead of truncating silently', () => {
    const details = boundDetails({ robotsTxt: 'x'.repeat(50_000) })
    expect(String(details['robotsTxt'])).toContain('...[truncated]')
  })

  it('http:mixed-content lists every offender, not the first 3', async () => {
    const imgs = Array.from({ length: 7 }, (_, i) => `<img src="http://ex.com/i${i}.png">`).join('')
    const res = await mixedContentRule.run(page(`<body>${imgs}</body>`), ctx)
    expect(res.type).toBe('error')
    expect(res.presentation?.values).toContainEqual({ key: 'Mixed-content resources', value: 7, kind: 'text' })
    expect(res.presentation?.evidence).toHaveLength(7)
    expect(res.presentation?.detailValues.some((f) => f.key.includes('omitted'))).toBe(false)
    expect(res.details).toBeUndefined()
  })

  it('robots:blocked-resources names each blocked resource', async () => {
    // @ts-expect-error network stub
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'User-agent: *\nDisallow: /blocked' })
    const resources = ['https://fulldetails.test/blocked/a.js', 'https://fulldetails.test/blocked/b.js', 'https://fulldetails.test/open/c.js', 'https://cdn.other/d.js']
    const res = await robotsBlockedResourcesRule.run(page('<p/>', { url: 'https://fulldetails.test/page', resources }), ctx)
    const urls = res.presentation?.evidence.filter((record) => record.name.startsWith('Blocked resource')).flatMap((record) => record.fields.map((f) => f.value))
    expect(urls).toEqual(['https://fulldetails.test/blocked/a.js', 'https://fulldetails.test/blocked/b.js'])
    expect(res.presentation?.detailValues.find((f) => f.key === 'Allowed resources')?.value).toBe(1)
    expect(res.details).toBeUndefined()
  })

  it('debug:page-object reports the full resource and header counts as labelled scalars, not a dump', async () => {
    const resources = Array.from({ length: 12 }, (_, i) => `https://ex.com/r${i}.js`)
    const res = await pageObjectRule.run(page('', { headers: { a: '1', b: '2' }, resources }), ctx)
    const values = Object.fromEntries(res.presentation!.values.map((f) => [f.key, f.value]))
    expect(values['Resource count']).toBe(12)
    expect(values['Header count']).toBe(2)
  })

  it('PSI summary keeps all run warnings', () => {
    const warnings = Array.from({ length: 8 }, (_, i) => `warning ${i}`)
    const summary = summarizePSI({ lighthouseResult: { runWarnings: warnings, categories: { performance: { score: 0.5 } } } } as never, 'https://ex.com', 'mobile')
    expect((summary as Record<string, unknown>)['warnings']).toHaveLength(8)
  })

  it('head-hreflang reports the complete language set even beyond the element sample', async () => {
    const links = Array.from({ length: 15 }, (_, i) => `<link rel="alternate" hreflang="l${i}" href="https://ex.com/${i}">`).join('')
    const res = await hreflangRule.run(page(`<head>${links}</head>`), ctx)
    const languages = (res.presentation?.detailValues.find((field) => field.key === 'Languages')?.value as string).split(', ')
    expect(languages.length).toBe(15)
  })

  it('body:parameterized-links lists the parameterized URLs themselves', async () => {
    const anchors = Array.from({ length: 14 }, (_, i) => `<a href="/p?x=${i}">a</a>`).join('')
    const res = await parameterizedLinksRule.run(page(`<body>${anchors}</body>`), ctx)
    const urls = res.presentation?.evidence.map((record) => record.fields.find((field) => field.key === 'Resolved URL')?.value)
    expect(urls).toHaveLength(14)
    expect(urls?.every((url) => typeof url === 'string' && url.includes('?'))).toBe(true)
  })
})
