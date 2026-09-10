import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'

import { ldjsonRule } from '@/rules/dom/ldjson'
import { schemaArticlePresentRule } from '@/rules/schema/articlePresent'
import { ResultDetails } from '@/components/result/ResultDetails'
import { toResultCopyPayload } from '@/components/result/resultCopy'
it('labels malformed script numbers and never coerces invalid type objects into visible text', async () => {
  const html = '<script type="application/ld+json">broken</script><script type="application/ld+json">{"@type":["Article",{}]}</script>'
  const page = { html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html') }
  const result = await ldjsonRule.run(page, { globals: {} })
  expect(result.type).toBe('warn')
  expect(result.details?.['types']).toEqual(['Article'])
  const ui = renderToStaticMarkup(<ResultDetails details={result.details} />)
  expect(ui).toContain('Script number')
  expect(ui).toContain('Invalid JSON')
  expect(ui).not.toContain('[object Object]')
  expect(toResultCopyPayload(result)).not.toContain('[object Object]')
  const article = await schemaArticlePresentRule.run(page, { globals: {} })
  expect(article.message).toContain('Article')
  expect(article.message).not.toContain('[object Object]')
})
