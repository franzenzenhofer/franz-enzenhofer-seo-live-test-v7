import { describe, expect, it } from 'vitest'

import { robotsMetaListRule as rule } from '@/rules/head/robotsMetaList'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(
  await rule.run({ html, url: 'https://ex.com', doc: doc(html) }, { globals: {} }), rule, 'test',
)

describe('rule: robots meta list', () => {
  it('reports none as an empty inventory', async () => {
    const r = await run('<html><head></head></html>')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(915)
    expect(r.presentation?.values).toEqual([{ key: 'Robots meta', value: 'Not found', kind: 'text' }])
    expect(r.presentation?.noMarkup).toBe('No robots meta element found')
  })

  it('lists all meta robots variants with complete original markup', async () => {
    const html = '<meta name="robots" content="all"><meta name="bingbot" content="index">'
    const r = await run(html)
    expect(r.type).toBe('info')
    expect(r.priority).toBe(640)
    expect(r.presentation?.values).toContainEqual({ key: 'Robots meta tags', value: 2, kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Crawlers listed', value: 'robots, bingbot', kind: 'text' })
    expect(r.presentation?.values.filter(({ kind }) => kind === 'original').map(({ key }) => key)).toEqual(['<meta name="robots">', '<meta name="bingbot">'])
    expect(r.presentation?.evidence.map(({ name }) => name)).toEqual(['<meta name="robots">', '<meta name="bingbot">'])
    expect(r.presentation?.evidence[1]?.fields).toContainEqual({ key: 'Crawler', value: 'bingbot', kind: 'text' })
    expect(r.presentation?.markup).toHaveLength(2)
    expect(r.presentation?.markup.map(({ value }) => value)).toContain('<meta name="robots" content="all">')
  })

  it('excludes standard HTML metas that are not robots directives', async () => {
    const html = '<meta name="viewport" content="width=device-width, initial-scale=1">'
      + '<meta name="generator" content="MediaWiki 1.47.0-wmf.17">'
      + '<meta name="robots" content="max-image-preview:standard">'
    const r = await run(html)
    expect(r.presentation?.values).toContainEqual({ key: 'Crawlers listed', value: 'robots', kind: 'text' })
    expect(r.presentation?.markup).toHaveLength(1)
    const copy = toResultCopyPayload(r)
    expect(copy).not.toContain('viewport')
    expect(copy).not.toContain('generator')
  })

  it('reports complete source omissions when more than ten tags are captured', async () => {
    const html = Array.from({ length: 12 }, (_, i) => `<meta name="crawler${i}" content="noindex">`).join('')
    const r = await run(html)
    expect(r.presentation?.values).toContainEqual({ key: 'Robots meta tags', value: 12, kind: 'text' })
    expect(r.presentation?.markup).toHaveLength(10)
    expect(r.presentation?.values.filter(({ kind }) => kind === 'original')).toHaveLength(0)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Markup omitted', value: 2, kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Evidence retained', value: 10, kind: 'text' })
  })

  it('preserves the documentation reference and removes the legacy details payload', async () => {
    const r = await run('<meta name="robots" content="all">')
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
