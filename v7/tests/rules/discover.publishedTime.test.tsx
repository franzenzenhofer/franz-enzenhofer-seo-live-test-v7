import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'

import { discoverPublishedTimeRule } from '@/rules/discover/publishedTime'
import { enrichResult } from '@/core/runHelpers'
import { ResultDetails } from '@/components/result/ResultDetails'
import { toResultCopyPayload } from '@/components/result/resultCopy'
const run = async (html: string) => enrichResult(await discoverPublishedTimeRule.run({
  html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html'),
}, { globals: {} }), discoverPublishedTimeRule, 'test')

it('does not demand optional publication or modification dates', async () => {
  expect((await run('')).type).toBe('info')
  const result = await run('<meta property="article:published_time" content="2024-01-01">')
  expect(result.type).toBe('info')
  expect(result.message).toContain('no modification date declared')
  expect(toResultCopyPayload(result)).toContain('Do not invent a modification date')
})
it('keeps conflicting declared values with their own sources and places readable evidence before raw code', async () => {
  const result = await run('<meta property="article:published_time" content="2024-01-01"><script type="application/ld+json">{"@type":"Organization"}</script><script type="application/ld+json">{"@type":"Article","datePublished":"2024-02-01","dateModified":"2024-03-01"}</script>')
  expect(result.details?.['declaredDates']).toHaveLength(3)
  expect(result.details?.['sourceHtml']).not.toContain('Organization')
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('2024-01-01')
  expect(copy).toContain('JSON-LD script 2: datePublished')
  const ui = renderToStaticMarkup(<ResultDetails details={result.details} />)
  expect(ui.indexOf('Declared dates')).toBeLessThan(ui.indexOf('data-testid="detail-source"'))
  expect(ui).not.toContain('[object Object]')
})
it('does not present parsing failure as an absence finding', async () => {
  const result = await run('<script type="application/ld+json">invalid</script>')
  expect(result.type).toBe('warn')
  expect(result.message).toContain('incomplete')
})
