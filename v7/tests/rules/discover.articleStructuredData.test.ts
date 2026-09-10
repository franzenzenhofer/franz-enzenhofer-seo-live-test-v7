import { expect, it } from 'vitest'

import { discoverArticleStructuredDataRule } from '@/rules/discover/articleStructuredData'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const run = async (html: string) => enrichResult(await discoverArticleStructuredDataRule.run({
  html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html'),
}, { globals: {} }), discoverArticleStructuredDataRule, 'test')

it('does not describe optional markup absence as a Discover error', async () => {
  const result = await run('<h1>Products</h1>')
  expect(result.type).toBe('info')
  expect(result.message).toContain('does not require')
  expect(toResultCopyPayload(result)).toContain('only when this page is an article')
})
it('includes BlogPosting and points to the actual matching script instead of the first block', async () => {
  const result = await run('<script type="application/ld+json">{"@type":"Organization"}</script><script type="application/ld+json">{"@graph":[{"@type":"https://schema.org/BlogPosting","headline":"Article source"}]}</script>')
  expect(result.type).toBe('ok')
  expect(result.details?.['sourceHtml']).toContain('Article source')
  expect(result.details?.['sourceHtml']).not.toContain('Organization')
  expect(result.details?.['foundTypes']).toEqual(['BlogPosting'])
})
it('reports incomplete parsing instead of claiming markup absence or a clean pass', async () => {
  const result = await run('<script type="application/ld+json">broken</script><script type="application/ld+json">{"@type":"Article"}</script>')
  expect(result.type).toBe('warn')
  expect(result.message).toContain('incomplete')
  expect(result.details?.['parseErrors']).toEqual([expect.objectContaining({ scriptNumber: 1 })])
  expect(toResultCopyPayload(result)).toContain('Fix the reported JSON syntax errors')
})
