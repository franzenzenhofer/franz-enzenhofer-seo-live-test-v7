import { describe, expect, it } from 'vitest'

import { schemaWebSiteSearchActionRule } from '@/rules/schema/webSiteSearchAction'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const deprecationNoteOf = (r: any) => r.presentation?.checked.find((field: any) => field.key === 'Applicable condition')?.value as string | undefined
const missingFieldsOf = (r: any) => r.presentation?.evidence.flatMap((record: any) => record.fields)
  .find((field: any) => field.key === 'Missing fields')?.value as string | undefined

describe('schema: website searchaction', () => {
  it('reports complete SearchAction as info because Google retired the sitelinks search box', async () => {
    const json = '<script type="application/ld+json">{\"@type\":\"WebSite\",\"url\":\"https://ex.com\",\"potentialAction\":{\"@type\":\"SearchAction\",\"target\":\"https://ex.com/search?q={search_term_string}\",\"query-input\":\"required name=search_term_string\"}}</script>'
    const r = await schemaWebSiteSearchActionRule.run({ html: '', url: 'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect(r.type).toBe('info')
    expect(deprecationNoteOf(r)).toContain('no longer')
    expect(r.presentation?.evidence).toContainEqual(expect.objectContaining({
      name: 'Deprecation announcement', fields: [expect.objectContaining({ key: 'URL', value: 'https://developers.google.com/search/updates#bye-sitelinkbox' })],
    }))
    expect(r.details).toBeUndefined()
  })

  it('reports missing SearchAction as info, not warn (feature retired)', async () => {
    const json = '<script type="application/ld+json">{\"@type\":\"WebSite\",\"url\":\"https://ex.com\"}</script>'
    const r = await schemaWebSiteSearchActionRule.run({ html: '', url: 'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect(r.type).toBe('info')
    expect(missingFieldsOf(r)).toContain('potentialAction(SearchAction)')
    expect(r.details).toBeUndefined()
  })
})
