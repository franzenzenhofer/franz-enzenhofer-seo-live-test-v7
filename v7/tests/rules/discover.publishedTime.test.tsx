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
  expect(result.presentation?.values.slice(0, 2)).toEqual([
    { key: 'Published', value: '2024-01-01', kind: 'text' }, { key: 'Modified', value: 'Not found', kind: 'text' },
  ])
  expect(result.presentation?.values[2]).toEqual(result.presentation?.markup[0])
  expect(result.presentation?.detailValues).toContainEqual({ key: 'Published declarations', value: 1, kind: 'text' })
  expect(result.presentation?.detailValues).toContainEqual({ key: 'Modified declarations', value: 0, kind: 'text' })
  expect(toResultCopyPayload(result)).toContain('2024-01-01')
  expect(toResultCopyPayload(result)).not.toContain('Do not invent a modification date')
  expect(result.details).toBeUndefined()
})
it('keeps conflicting declared values with their own sources and places readable evidence before raw code', async () => {
  const html = '<meta property="article:published_time" data-origin="cms" content="2024-01-01"><script type="application/ld+json">{"@type":"Organization"}</script><script type="application/ld+json">{"@type":"Article","datePublished":"2024-02-01","dateModified":"2024-03-01"}</script>'
  const result = await run(html)
  expect(result.presentation?.values.slice(0, 2)).toEqual([
    { key: 'Published', value: '2024-01-01', kind: 'text' }, { key: 'Modified', value: '2024-03-01', kind: 'text' },
  ])
  expect(result.presentation?.detailValues).toContainEqual({ key: 'Published declarations', value: 2, kind: 'text' })
  expect(result.presentation?.detailValues).toContainEqual({ key: 'Modified declarations', value: 1, kind: 'text' })
  expect(result.presentation?.evidence.map((record) => [record.name, ...record.fields.slice(0, -1).map(({ key, value }) => `${key}: ${value}`)])).toEqual([
    ['<meta property="article:published_time">', 'content: 2024-01-01'],
    ['<script type="application/ld+json"> 1', 'Dates: Not found'],
    ['<script type="application/ld+json"> 2', 'datePublished: 2024-02-01', 'dateModified: 2024-03-01'],
  ])
  expect(result.presentation?.markup).toHaveLength(3)
  expect(result.presentation?.markup[0]?.value).toBe('<meta property="article:published_time" data-origin="cms" content="2024-01-01">')
  expect(result.presentation?.markup[2]?.value).toContain('datePublished')
  expect(result.presentation?.markup.map((field) => field.value).join('')).toContain('Organization')
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('2024-01-01')
  expect(copy).toContain('datePublished: 2024-02-01')
  expect(copy).toContain('https://developers.google.com/search/docs/appearance/structured-data/article')
  expect(copy).not.toContain('[object Object]')
  expect(result.details).toBeUndefined()
})
it('does not present parsing failure as an absence finding', async () => {
  const result = await run('<script type="application/ld+json">invalid</script>')
  expect(result.type).toBe('warn')
  expect(result.presentation?.values).toContainEqual({ key: 'JSON-LD parse errors', value: 'script 1', kind: 'text' })
  expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Parse error')).toBeTruthy()
  expect(result.presentation?.markup).toHaveLength(1)
})
it('marks an identical modified date as unchanged so both rows stay distinct', async () => {
  const result = await run('<meta property="article:published_time" content="2024-01-01"><meta property="article:modified_time" content="2024-01-01">')
  expect(result.presentation?.values.slice(0, 2)).toEqual([
    { key: 'Published', value: '2024-01-01', kind: 'text' }, { key: 'Modified', value: '2024-01-01 (unchanged)', kind: 'text' },
  ])
})
it('retains empty checked markup without counting it as a date', async () => {
  const html = '<meta property="article:published_time" content="  ">'
  const result = await run(html)
  expect(result.type).toBe('info')
  expect(result.presentation?.values[0]).toEqual({ key: 'Published', value: 'Not found', kind: 'text' })
  expect(result.presentation?.detailValues).toContainEqual({ key: 'Published declarations', value: 0, kind: 'text' })
  expect(result.presentation?.markup).toHaveLength(1)
  expect(result.presentation?.markup[0]?.value).toBe(html)
})
