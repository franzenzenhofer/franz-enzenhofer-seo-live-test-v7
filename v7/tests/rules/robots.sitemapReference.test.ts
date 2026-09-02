import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsSitemapReferenceRule } from '@/rules/robots/sitemapReference'

const D = () => new DOMParser().parseFromString('<p/>', 'text/html')
const page = (url: string) => ({ html: '', url, doc: D() })
const stub = (txt: string) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => txt }))

describe('rule: robots sitemap reference', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports ok for a fully qualified sitemap URL', async () => {
    stub('Sitemap: https://ex.com/sitemap.xml')
    const r = await robotsSitemapReferenceRule.run(page('https://ex.com/a') as never, { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.details?.['sitemapUrls']).toEqual(['https://ex.com/sitemap.xml'])
  })

  it('reports info (not warn) when no sitemap is declared - other submission methods exist', async () => {
    stub('User-agent: *\nDisallow:')
    const r = await robotsSitemapReferenceRule.run(page('https://nosm.test/a') as never, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.message).toContain('No Sitemap reference')
  })

  it('warns on a relative sitemap value (must be a fully qualified URL)', async () => {
    stub('Sitemap: /sitemap.xml')
    const r = await robotsSitemapReferenceRule.run(page('https://relsm.test/a') as never, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.details?.['invalidSitemapUrls']).toEqual(['/sitemap.xml'])
  })

  it('warns when valid and invalid sitemap values are mixed', async () => {
    stub('Sitemap: https://mixsm.test/sitemap.xml\nSitemap: sitemap-2.xml')
    const r = await robotsSitemapReferenceRule.run(page('https://mixsm.test/a') as never, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.details?.['sitemapUrls']).toEqual(['https://mixsm.test/sitemap.xml'])
    expect(r.details?.['invalidSitemapUrls']).toEqual(['sitemap-2.xml'])
  })
})
