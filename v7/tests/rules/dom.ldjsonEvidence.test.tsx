import { expect, it } from 'vitest'

import { ldjsonRule } from '@/rules/dom/ldjson'
import { schemaArticlePresentRule } from '@/rules/schema/articlePresent'
import { toResultCopyPayload } from '@/components/result/resultCopy'
it('labels malformed scripts by their numbered tag and never coerces invalid type objects into visible text', async () => {
  const html = '<script type="application/ld+json">broken</script><script type="application/ld+json">{"@type":["Article",{}]}</script>'
  const page = { html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html') }
  const result = await ldjsonRule.run(page, { globals: {} })
  expect(result.type).toBe('warn')
  expect(result.presentation?.evidence.map((record) => record.name)).toEqual(['<script type="application/ld+json"> 1', '<script type="application/ld+json"> 2'])
  expect(result.presentation?.evidence[1]?.fields.find((field) => field.key === 'Types')?.value).toBe('Article')
  expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Syntax')?.value).toBe('Invalid JSON')
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('Parse errors: script 1')
  expect(copy).toContain('Invalid JSON')
  expect(copy).not.toContain('[object Object]')
  const article = await schemaArticlePresentRule.run(page, { globals: {} })
  expect(article.presentation?.evidence[1]?.fields).toContainEqual({ key: 'Article', value: 'Unnamed', kind: 'text' })
  expect(toResultCopyPayload(article)).not.toContain('[object Object]')
})
