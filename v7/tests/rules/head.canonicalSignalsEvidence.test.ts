import { expect, it } from 'vitest'

import { canonicalSignalsConflictRule } from '@/rules/head/canonicalSignalsConflict'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'
const run = async (html: string, link = '') => enrichResult(await canonicalSignalsConflictRule.run({
  html, url: 'https://example.test/page', doc: new DOMParser().parseFromString(html, 'text/html'), headers: { link },
}, { globals: {} }), canonicalSignalsConflictRule, 'test')

it('does not invent a canonical source when both declarations are absent', async () => {
  const result = await run('')
  expect(result.type).toBe('info')
  expect(result.presentation?.values).toContainEqual({ key: 'Comparison', value: 'No canonical declarations found', kind: 'text' })
  expect(result.presentation?.values).toContainEqual({ key: 'Canonical sources', value: 0, kind: 'text' })
  expect(result.presentation?.input).toBe('Static DOM + HTTP response headers')
  expect(result.details).toBeUndefined()
})
it('identifies both conflicting values and their source records in copied findings', async () => {
  const result = await run('<link rel="canonical" href="/one">', '<https://example.test/two>; rel="canonical"')
  expect(result.type).toBe('error')
  expect(result.presentation?.evidence).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: 'HTML canonical tag' }), expect.objectContaining({ name: 'HTTP Link header' }),
  ]))
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('https://example.test/one')
  expect(copy).toContain('https://example.test/two')
  expect(copy).not.toContain('server or CDN configuration')
})
it('reports invalid authored URLs instead of throwing a rule execution error', async () => {
  const result = await run('<link rel="canonical" href="http://[invalid">')
  expect(result.type).toBe('warn')
  expect(result.presentation?.values).toContainEqual({ key: 'Comparison', value: 'Invalid or unsupported URL', kind: 'text' })
  expect(result.presentation?.input).toBe('Static DOM + HTTP response headers + Page URL')
  expect(toResultCopyPayload(result)).toContain('http://[invalid')
})
