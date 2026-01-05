import { describe, expect, it } from 'vitest'

import { schemaWebSiteSearchActionRule } from '@/rules/schema/webSiteSearchAction'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('schema: website searchaction', () => {
  it('passes with SearchAction target and query-input', async () => {
    const json = '<script type="application/ld+json">{\"@type\":\"WebSite\",\"url\":\"https://ex.com\",\"potentialAction\":{\"@type\":\"SearchAction\",\"target\":\"https://ex.com/search?q={search_term_string}\",\"query-input\":\"required name=search_term_string\"}}</script>'
    const r = await schemaWebSiteSearchActionRule.run({ html: '', url: 'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect(r.type).toBe('ok')
  })

  it('warns when SearchAction is missing', async () => {
    const json = '<script type="application/ld+json">{\"@type\":\"WebSite\",\"url\":\"https://ex.com\"}</script>'
    const r = await schemaWebSiteSearchActionRule.run({ html: '', url: 'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect(r.type).toBe('warn')
  })
})
