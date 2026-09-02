import { describe, expect, it } from 'vitest'

import { schemaWebSiteSearchActionRule } from '@/rules/schema/webSiteSearchAction'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('schema: website searchaction', () => {
  it('reports complete SearchAction as info because Google retired the sitelinks search box', async () => {
    const json = '<script type="application/ld+json">{\"@type\":\"WebSite\",\"url\":\"https://ex.com\",\"potentialAction\":{\"@type\":\"SearchAction\",\"target\":\"https://ex.com/search?q={search_term_string}\",\"query-input\":\"required name=search_term_string\"}}</script>'
    const r = await schemaWebSiteSearchActionRule.run({ html: '', url: 'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.message).toContain('no longer')
  })

  it('reports missing SearchAction as info, not warn (feature retired)', async () => {
    const json = '<script type="application/ld+json">{\"@type\":\"WebSite\",\"url\":\"https://ex.com\"}</script>'
    const r = await schemaWebSiteSearchActionRule.run({ html: '', url: 'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect(r.type).toBe('info')
  })
})
