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
    expect((res.details?.['offenders'] as unknown[]).length).toBe(7)
    expect(res.details?.['snippet']).not.toContain('omitted')
  })

  it('robots:blocked-resources names each blocked resource', async () => {
    // @ts-expect-error network stub
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => 'User-agent: *\nDisallow: /blocked' })
    const resources = ['https://ex.com/blocked/a.js', 'https://ex.com/blocked/b.js', 'https://ex.com/open/c.js', 'https://cdn.other/d.js']
    const res = await robotsBlockedResourcesRule.run(page('<p/>', { resources }), ctx)
    expect(res.details?.['blockedResources']).toEqual(['https://ex.com/blocked/a.js', 'https://ex.com/blocked/b.js'])
    expect(res.details?.['allowedCount']).toBe(1)
  })

  it('debug:page-object carries full headers and all resources', async () => {
    const resources = Array.from({ length: 12 }, (_, i) => `https://ex.com/r${i}.js`)
    const res = await pageObjectRule.run(page('', { headers: { a: '1', b: '2' }, resources }), ctx)
    const summary = res.details?.['summary'] as Record<string, unknown>
    expect((summary['resources'] as unknown[]).length).toBe(12)
    expect(summary['headers']).toEqual({ a: '1', b: '2' })
  })

  it('PSI summary keeps all run warnings', () => {
    const warnings = Array.from({ length: 8 }, (_, i) => `warning ${i}`)
    const summary = summarizePSI({ lighthouseResult: { runWarnings: warnings, categories: { performance: { score: 0.5 } } } } as never, 'https://ex.com', 'mobile')
    expect((summary as Record<string, unknown>)['warnings']).toHaveLength(8)
  })

  it('head-hreflang reports the complete language set even beyond the element sample', async () => {
    const links = Array.from({ length: 15 }, (_, i) => `<link rel="alternate" hreflang="l${i}" href="https://ex.com/${i}">`).join('')
    const res = await hreflangRule.run(page(`<head>${links}</head>`), ctx)
    expect((res.details?.['languages'] as string[]).length).toBe(15)
  })

  it('body:parameterized-links lists the parameterized URLs themselves', async () => {
    const anchors = Array.from({ length: 14 }, (_, i) => `<a href="/p?x=${i}">a</a>`).join('')
    const res = await parameterizedLinksRule.run(page(`<body>${anchors}</body>`), ctx)
    expect((res.details?.['hrefs'] as string[]).length).toBe(14)
  })
})
