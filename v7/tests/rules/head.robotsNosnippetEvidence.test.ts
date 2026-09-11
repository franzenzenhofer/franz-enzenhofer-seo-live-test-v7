import { expect, it } from 'vitest'

import { robotsNosnippetRule } from '@/rules/head/robotsNosnippet'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

it('distinguishes text restrictions from static-image and indexing permission, preserving named sources', async () => {
  const html = '<meta name="googlebot" content="max-snippet:0">'
  const result = enrichResult(await robotsNosnippetRule.run({ html, url: 'https://example.test',
    doc: new DOMParser().parseFromString(html, 'text/html'), headers: { 'X-Robots-Tag': 'bingbot: nosnippet' },
  }, { globals: {} }), robotsNosnippetRule, 'test')
  expect(result.type).toBe('warn')
  expect(result.presentation?.values).toContainEqual({ key: 'nosnippet restrictions', value: 2, kind: 'text' })
  // Order: plain 'nosnippet' matches first (header), then 'max-snippet:0' matches (meta) -
  // this mirrors the original union construction order in createRobotsRestrictionRule.
  expect(result.presentation?.evidence).toContainEqual({ name: 'Instruction 1', fields: [
    { key: 'Crawler', value: 'bingbot', kind: 'text' },
    { key: 'Source', value: 'HTTP response header', kind: 'text' },
    { key: 'Instruction', value: 'nosnippet', kind: 'text' },
    { key: 'Header name', value: 'x-robots-tag[0]', kind: 'text' },
  ] })
  expect(result.presentation?.evidence).toContainEqual({ name: 'Instruction 2', fields: [
    { key: 'Crawler', value: 'googlebot', kind: 'text' },
    { key: 'Source', value: 'HTML meta tag', kind: 'text' },
    { key: 'Instruction', value: 'max-snippet:0', kind: 'text' },
    { key: 'DOM path', value: 'html > head > meta', kind: 'text' },
  ] })
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('bingbot')
  expect(copy).toContain('googlebot')
  expect(copy).toContain('max-snippet:0')
  expect(copy).not.toContain('[object Object]')
  expect(result.details).toBeUndefined()
})
