import { expect, it } from 'vitest'

import { discoverAuthorPresentRule } from '@/rules/discover/authorPresent'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'
const run = async (html: string) => enrichResult(await discoverAuthorPresentRule.run({
  html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html'),
}, { globals: {} }), discoverAuthorPresentRule, 'test')

it('reports all authors with the correct script rather than selecting an unrelated first block', async () => {
  const result = await run('<script type="application/ld+json">{"@type":"Organization"}</script><script type="application/ld+json">{"@type":"Article","author":[{"name":"Jane"},{"name":"John"}]}</script>')
  expect(result.details?.['authors']).toEqual([{ name: 'Jane', foundIn: 'JSON-LD script 2' }, { name: 'John', foundIn: 'JSON-LD script 2' }])
  expect(result.details?.['sourceHtml']).not.toContain('Organization')
  const copied = toResultCopyPayload(result)
  expect(copied).toContain('Jane')
  expect(copied).toContain('John')
  expect(copied).not.toContain('[object Object]')
})
it('does not invent a missing-metadata requirement or treat unresolved references as names', async () => {
  const result = await run('<script type="application/ld+json">{"author":{"@id":"#person"}}</script>')
  expect(result.type).toBe('info')
  expect(result.message).toContain('No author name')
  expect(toResultCopyPayload(result)).toContain('does not verify a visible byline')
})
it('names incomplete checks and identifies a malformed block', async () => {
  const result = await run('<meta name="author" content="Jane"><script type="application/ld+json">broken</script>')
  expect(result.type).toBe('warn')
  expect(result.message).toContain('incomplete')
  expect(result.details?.['authors']).toEqual([{ name: 'Jane', foundIn: 'Author meta tag' }])
})
