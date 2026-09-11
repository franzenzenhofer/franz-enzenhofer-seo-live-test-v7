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
  expect(result.presentation?.evidence.filter(({ name }) => name.startsWith('Instruction '))).toHaveLength(3)
  expect(result.presentation?.evidence).toContainEqual({ name: 'Instruction 1', fields: [
    { key: 'Crawler', value: 'All crawlers (including Googlebot)', kind: 'text' },
    { key: 'Source', value: 'HTML meta tag', kind: 'text' },
    { key: 'Value', value: '-1', kind: 'text' },
    { key: 'Valid', value: 'Yes', kind: 'text' },
  ] })
  expect(result.presentation?.evidence).toContainEqual({ name: 'Instruction 2', fields: [
    { key: 'Crawler', value: 'googlebot', kind: 'text' },
    { key: 'Source', value: 'HTML meta tag', kind: 'text' },
    { key: 'Value', value: 'bad', kind: 'text' },
    { key: 'Valid', value: 'No', kind: 'text' },
  ] })
  expect(result.presentation?.evidence).toContainEqual({ name: 'Instruction 3', fields: [
    { key: 'Crawler', value: 'All crawlers (including Googlebot)', kind: 'text' },
    { key: 'Source', value: 'HTTP response header', kind: 'text' },
    { key: 'Value', value: '0', kind: 'text' },
    { key: 'Valid', value: 'Yes', kind: 'text' },
    { key: 'Header name', value: 'x-robots-tag[0]', kind: 'text' },
  ] })
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('googlebot')
  expect(copy).toContain('HTTP response header')
  expect(copy).toContain('bad')
  expect(copy).not.toContain('[object Object]')
  expect(result.details).toBeUndefined()
})
