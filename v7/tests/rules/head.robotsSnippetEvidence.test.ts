import { expect, it } from 'vitest'

import { robotsMaxSnippetRule } from '@/rules/head/robotsMaxSnippet'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

it('names each crawler, source and raw value for a zero, unlimited, invalid and header-sourced instruction', async () => {
  const html = '<meta name="robots" content="max-snippet:-1"><meta name="googlebot" content="max-snippet:bad">'
  const result = enrichResult(await robotsMaxSnippetRule.run({ html, url: 'https://example.test',
    doc: new DOMParser().parseFromString(html, 'text/html'), headers: { 'X-Robots-Tag': 'max-snippet:0' },
  }, { globals: {} }), robotsMaxSnippetRule, 'test')
  expect(result.type).toBe('warn')
  expect(result.presentation?.values.map(({ key, value }) => `${key}: ${value}`)).toEqual([
    'max-snippet: -1, bad, 0', 'Applies to: all crawlers, googlebot', 'Invalid values: 1 of 3',
    '<meta name="robots">: <meta name="robots" content="max-snippet:-1">',
    '<meta name="googlebot">: <meta name="googlebot" content="max-snippet:bad">'])
  expect(result.presentation?.evidence).toEqual([
    { name: '<meta name="robots">', fields: [
      { key: 'Crawler', value: 'all crawlers', kind: 'text' }, { key: 'Value', value: '-1', kind: 'text' },
      { key: 'Syntax', value: 'Valid', kind: 'text' }, { key: 'DOM path', value: 'html > head > meta:nth-of-type(1)', kind: 'path' }] },
    { name: '<meta name="googlebot">', fields: [
      { key: 'Crawler', value: 'googlebot', kind: 'text' }, { key: 'Value', value: 'bad', kind: 'text' },
      { key: 'Syntax', value: 'Invalid', kind: 'text' }, { key: 'DOM path', value: 'html > head > meta:nth-of-type(2)', kind: 'path' }] },
  ])
  expect(result.presentation?.detailValues).toEqual([
    { key: 'Markup retained', value: 2, kind: 'text' }, { key: 'Markup omitted', value: 0, kind: 'text' },
    { key: 'Evidence retained', value: 2, kind: 'text' }, { key: 'Evidence omitted', value: 0, kind: 'text' },
    { key: 'X-Robots-Tag', value: 'max-snippet:0', kind: 'text' }])
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('googlebot')
  expect(copy).toContain('HTTP response header')
  expect(copy).toContain('bad')
  expect(copy).not.toContain('[object Object]')
  expect(result.details).toBeUndefined()
})
