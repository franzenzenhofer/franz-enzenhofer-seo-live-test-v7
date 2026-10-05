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
  expect(result.presentation?.values).toEqual([
    { key: 'Canonical link', value: 'Not found', kind: 'text' },
    { key: 'HTTP canonical', value: 'Not found', kind: 'text' },
  ])
  expect(result.presentation?.input).toBe('Static DOM + HTTP response headers')
  expect(result.details).toBeUndefined()
})
it('shows both URLs with a closed verdict and the markup when the declarations conflict', async () => {
  const result = await run('<link rel="canonical" href="/one">', '<https://example.test/two>; rel="canonical"')
  expect(result.type).toBe('error')
  expect(result.presentation?.values).toEqual([
    { key: 'Canonical href', value: '/one', kind: 'text' },
    { key: 'Canonical URL', value: 'https://example.test/one', kind: 'url' },
    { key: 'HTTP canonical', value: 'https://example.test/two', kind: 'url' },
    { key: 'Comparison', value: 'Differs from HTTP canonical (path)', kind: 'text' },
    { key: '<link rel="canonical">', value: '<link rel="canonical" href="/one">', kind: 'original', fidelity: 'complete-original' },
  ])
  expect(result.presentation?.evidence).toEqual([expect.objectContaining({ name: '<link rel="canonical">' })])
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('https://example.test/one')
  expect(copy).toContain('https://example.test/two')
  expect(copy).not.toContain('server or CDN configuration')
})
it('reports only the HTML declaration as a fact, without a one-sided comparison', async () => {
  const result = await run('<link rel="canonical" href="https://example.test/page">')
  expect(result.type).toBe('info')
  expect(result.presentation?.values.map(({ key }) => key)).toEqual(['Canonical URL', 'HTTP canonical', '<link rel="canonical">'])
  expect(result.presentation?.values).toContainEqual({ key: 'HTTP canonical', value: 'Not found', kind: 'text' })
})
it('omits the HTTP row when response headers were never captured', async () => {
  const html = '<link rel="canonical" href="https://example.test/page">'
  const result = await canonicalSignalsConflictRule.run({ html, url: 'https://example.test/page', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
  expect(result.presentation?.input).toBe('Static DOM + Page URL')
  expect(result.presentation?.values.some(({ key }) => key === 'HTTP canonical')).toBe(false)
})
it('reports invalid authored URLs instead of throwing a rule execution error', async () => {
  const result = await run('<link rel="canonical" href="http://[invalid">')
  expect(result.type).toBe('warn')
  expect(result.presentation?.values).toContainEqual({ key: 'Canonical href', value: 'http://[invalid', kind: 'text' })
  expect(result.presentation?.values).toContainEqual({ key: 'Canonical URL', value: 'Invalid URL', kind: 'text' })
  expect(result.presentation?.values.some(({ key }) => key === 'Comparison')).toBe(false)
  expect(result.presentation?.input).toBe('Static DOM + HTTP response headers + Page URL')
  expect(toResultCopyPayload(result)).toContain('http://[invalid')
})
