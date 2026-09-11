import { expect, it } from 'vitest'

import { ldjsonRule } from '@/rules/dom/ldjson'
import { schemaArticlePresentRule } from '@/rules/schema/articlePresent'
import { toResultCopyPayload } from '@/components/result/resultCopy'
it('labels malformed script numbers and never coerces invalid type objects into visible text', async () => {
  const html = '<script type="application/ld+json">broken</script><script type="application/ld+json">{"@type":["Article",{}]}</script>'
  const page = { html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html') }
  const result = await ldjsonRule.run(page, { globals: {} })
  expect(result.type).toBe('warn')
  expect(result.presentation?.evidence[1]?.fields.find((field) => field.key === 'Declared types')?.value).toBe('Article')
  expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Syntax')?.value).toBe('Invalid JSON')
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('Script number')
  expect(copy).toContain('Invalid JSON')
  expect(copy).not.toContain('[object Object]')
  const article = await schemaArticlePresentRule.run(page, { globals: {} })
  expect(article.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Schema type', value: 'Article', kind: 'text' })
  expect(toResultCopyPayload(article)).not.toContain('[object Object]')
})
