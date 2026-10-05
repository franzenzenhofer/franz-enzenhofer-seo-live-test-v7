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
  // Order: plain 'nosnippet' matches first (header), then 'max-snippet:0' matches (meta) -
  // this mirrors the original union construction order in createRobotsRestrictionRule.
  expect(result.presentation?.values.slice(0, 2)).toEqual([
    { key: 'Instructions', value: 'nosnippet, max-snippet:0', kind: 'text' },
    { key: 'Applies to', value: 'bingbot, googlebot', kind: 'text' }])
  expect(result.presentation?.values).toContainEqual({ key: '<meta name="googlebot">', value: html, kind: 'original', fidelity: 'complete-original' })
  expect(result.presentation?.detailValues).toContainEqual({ key: 'X-Robots-Tag', value: 'bingbot: nosnippet', kind: 'text' })
  expect(result.presentation?.evidence).toEqual([{ name: '<meta name="googlebot">', fields: [
    { key: 'Crawler', value: 'googlebot', kind: 'text' },
    { key: 'Instruction', value: 'max-snippet:0', kind: 'text' },
    { key: 'DOM path', value: 'html > head > meta', kind: 'path' },
  ] }])
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('bingbot')
  expect(copy).toContain('googlebot')
  expect(copy).toContain('max-snippet:0')
  expect(copy).not.toContain('[object Object]')
  expect(result.details).toBeUndefined()
})
