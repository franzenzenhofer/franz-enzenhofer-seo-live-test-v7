import { expect, it } from 'vitest'

import { discoverArticleStructuredDataRule } from '@/rules/discover/articleStructuredData'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const run = async (html: string) => enrichResult(await discoverArticleStructuredDataRule.run({
  html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html'),
}, { globals: {} }), discoverArticleStructuredDataRule, 'test')

it('reports absence as informational with a labelled count and checked criterion', async () => {
  const result = await run('<h1>Products</h1>')
  expect(result.type).toBe('info')
  expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Article entities', value: 0 }))
  expect(result.presentation?.noMarkup).toBe('No JSON-LD scripts found')
  expect(toResultCopyPayload(result)).toContain('Criterion: Presence of a matching type')
  expect(toResultCopyPayload(result)).not.toContain('only when this page is an article')
})
it('identifies the matching script while retaining complete checked scripts, including nonmatches', async () => {
  const html = '<script type="application/ld+json" data-source="org">{"@type":"Organization"}</script><script type="application/ld+json">{"@graph":[{"@type":"https://schema.org/BlogPosting","headline":"Article source"}]}</script>'
  const result = await run(html)
  expect(result.type).toBe('ok')
  expect(result.presentation?.markup.map(({ value }) => value).join('')).toBe(html)
  expect(result.presentation?.detailValues).toEqual(expect.arrayContaining([
    expect.objectContaining({ key: 'Article types found', value: 'BlogPosting' }),
    expect.objectContaining({ key: 'Matching script numbers', value: '2' }),
  ]))
})
it('retains the warning for incomplete parsing alongside matches and factual error evidence', async () => {
  const result = await run('<script type="application/ld+json">broken</script><script type="application/ld+json">{"@type":"Article"}</script>')
  expect(result.type).toBe('warn')
  expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'JSON-LD parse errors', value: 1 }))
  expect(result.presentation?.evidence[0]?.fields).toContainEqual(expect.objectContaining({ key: 'Script number', value: 1 }))
  expect(toResultCopyPayload(result)).not.toContain('Fix the reported')
  for (const reference of discoverArticleStructuredDataRule.meta.references || []) expect(toResultCopyPayload(result)).toContain(reference)
})
it('counts every script and reports capture omissions without changing entity totals', async () => {
  const result = await run('<script type="application/ld+json">{"@type":"Article"}</script>'.repeat(12))
  expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Article entities', value: 12 }))
  expect(result.presentation?.markup).toHaveLength(10)
  expect(result.presentation?.evidence.at(-1)?.fields).toContainEqual(expect.objectContaining({ key: 'Scripts omitted', value: 2 }))
})
