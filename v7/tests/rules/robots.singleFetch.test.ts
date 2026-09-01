import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsTxtRule } from '@/rules/robots/robotsTxt'
import { robotsBlockedResourcesRule } from '@/rules/robots/blockedResources'
import { robotsComplexityRule } from '@/rules/robots/complexity'
import { robotsTxtSizeRule } from '@/rules/robots/robotsTxtSize'
import { robotsSitemapReferenceRule } from '@/rules/robots/sitemapReference'
import { googlebotUrlCheckRule } from '@/rules/robots/googlebotUrlCheck'

const TXT = 'User-agent: *\nDisallow: /private\nSitemap: https://six.test/sitemap.xml\n'

describe('robots rules share one robots.txt request per run', () => {
  afterEach(() => vi.restoreAllMocks())

  it('six concurrent robots rules trigger exactly one robots.txt fetch', async () => {
    const f = vi.fn().mockImplementation(async () => ({ ok: true, status: 200, text: async () => TXT }))
    vi.stubGlobal('fetch', f)
    const doc = new DOMParser().parseFromString('<p/>', 'text/html')
    const page = { html: '', url: 'https://six.test/page', doc, resources: ['https://six.test/a.js'] }
    const ctx = { globals: {} }
    const results = await Promise.all([
      robotsTxtRule.run(page as never, ctx),
      robotsBlockedResourcesRule.run(page as never, ctx),
      robotsComplexityRule.run(page as never, ctx),
      robotsTxtSizeRule.run(page as never, ctx),
      robotsSitemapReferenceRule.run(page as never, ctx),
      googlebotUrlCheckRule.run(page as never, ctx),
    ])
    expect(f).toHaveBeenCalledTimes(1)
    expect(f.mock.calls[0]?.[0]).toBe('https://six.test/robots.txt')
    results.forEach((r) => expect(['info', 'ok', 'warn']).toContain(r.type))
    const exists = results[0]
    expect(exists.message).toContain('robots.txt exists')
    expect(exists.details?.['robotsTxt']).toBe(TXT)
  })
})
