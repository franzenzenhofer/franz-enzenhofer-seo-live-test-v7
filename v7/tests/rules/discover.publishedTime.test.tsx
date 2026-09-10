import { expect, it } from 'vitest'

import { discoverPublishedTimeRule } from '@/rules/discover/publishedTime'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'
const run = async (html: string) => enrichResult(await discoverPublishedTimeRule.run({
  html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html'),
}, { globals: {} }), discoverPublishedTimeRule, 'test')

it('does not demand optional publication or modification dates', async () => {
  expect((await run('')).type).toBe('info')
  const result = await run('<meta property="article:published_time" content="2024-01-01">')
  expect(result.type).toBe('info')
  expect(result.presentation?.values).toContainEqual({ key: 'Published date declarations', value: 1, kind: 'text' })
  expect(result.presentation?.values).toContainEqual({ key: 'Modified date declarations', value: 0, kind: 'text' })
  expect(toResultCopyPayload(result)).toContain('2024-01-01')
  expect(toResultCopyPayload(result)).not.toContain('Do not invent a modification date')
  expect(result.details).toBeUndefined()
})
it('keeps conflicting declared values with their own sources and places readable evidence before raw code', async () => {
  const html = '<meta property="article:published_time" data-origin="cms" content="2024-01-01"><script type="application/ld+json">{"@type":"Organization"}</script><script type="application/ld+json">{"@type":"Article","datePublished":"2024-02-01","dateModified":"2024-03-01"}</script>'
  const result = await run(html)
  expect(result.presentation?.values).toContainEqual({ key: 'Published date declarations', value: 2, kind: 'text' })
  expect(result.presentation?.values).toContainEqual({ key: 'Modified date declarations', value: 1, kind: 'text' })
  expect(result.presentation?.evidence.find((record) => record.name === 'Declared dates')?.fields).toContainEqual({ key: 'Declaration 1 source', value: 'article:published_time', kind: 'text' })
  expect(result.presentation?.markup).toHaveLength(3)
  expect(result.presentation?.markup[0]?.value).toBe('<meta property="article:published_time" data-origin="cms" content="2024-01-01">')
  expect(result.presentation?.markup[2]?.value).toContain('datePublished')
  expect(result.presentation?.markup.map((field) => field.value).join('')).toContain('Organization')
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('2024-01-01')
  expect(copy).toContain('JSON-LD script 2: datePublished')
  expect(copy).toContain('https://developers.google.com/search/docs/appearance/structured-data/article')
  expect(copy).not.toContain('[object Object]')
  expect(result.details).toBeUndefined()
})
it('does not present parsing failure as an absence finding', async () => {
  const result = await run('<script type="application/ld+json">invalid</script>')
  expect(result.type).toBe('warn')
  expect(result.presentation?.values).toContainEqual({ key: 'JSON-LD parse errors', value: 1, kind: 'text' })
  expect(result.presentation?.evidence.find((record) => record.name === 'Parse errors')?.fields.find((field) => field.key === 'Parse error excerpt')?.value).toContain('Script 1:')
  expect(result.presentation?.markup).toHaveLength(1)
})
it('retains empty checked markup without counting it as a date', async () => {
  const html = '<meta property="article:published_time" content="  ">'
  const result = await run(html)
  expect(result.type).toBe('info')
  expect(result.presentation?.values[0]?.value).toBe(0)
  expect(result.presentation?.markup).toHaveLength(1)
  expect(result.presentation?.markup[0]?.value).toBe(html)
})
