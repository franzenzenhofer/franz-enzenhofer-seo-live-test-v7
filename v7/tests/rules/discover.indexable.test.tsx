import { describe, expect, it } from 'vitest'

import { discoverIndexableRule } from '@/rules/discover/indexable'
import { collectDomFacts } from '@/shared/domFacts.collect'
import { domFactsToDocument } from '@/shared/domFacts.document'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const run = async (html: string, headers: Record<string, string> = {}) => enrichResult(await discoverIndexableRule.run({
  html, doc: domFactsToDocument(collectDomFacts(doc(html), 'static'), doc), headers, url: 'https://example.test',
}, { globals: {} }), discoverIndexableRule, 'test')

describe('Discover indexing permission', () => {
  it('names all blockers, including body meta tags, and preserves original captured attributes', async () => {
    const source = '<meta name="googlebot" data-cms="visibility" content="noindex, nofollow">'
    const result = await run(`<meta name="robots" content="index"><body>${source}</body>`, { 'X-Robots-Tag': 'none' })
    expect(result.type).toBe('warn')
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Blocking instructions', value: 2 }))
    expect(result.presentation?.input).toBe('Static DOM + HTTP response headers')
    expect(result.presentation?.markup.map(({ value }) => value)).toContain(source)
    const copy = toResultCopyPayload(result)
    for (const text of ['Googlebot', 'HTML meta tag', 'HTTP response header', 'noindex, nofollow', 'X-Robots-Tag']) expect(copy).toContain(text)
    expect(copy).not.toContain('[object Object]')
    expect(copy).not.toContain('Keep the restriction')
    for (const reference of discoverIndexableRule.meta.references || []) expect(copy).toContain(reference)
  })
  it('ignores restrictions aimed only at other crawlers and labels actual indexing as unchecked', async () => {
    const result = await run('<meta name="bingbot" content="noindex">')
    expect(result.type).toBe('ok')
    expect(result.presentation?.detailValues).toContainEqual(expect.objectContaining({ key: 'Actual Google index status', value: 'Not checked' }))
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Blocking instructions', value: 0 }))
  })
  it('treats none as blocking, even beside index', async () => {
    const result = await run('<meta name="robots" content="none"><meta name="googlebot" content="index">')
    expect(result.type).toBe('warn')
    expect(result.presentation?.evidence[0]?.fields).toContainEqual(expect.objectContaining({ key: 'Instruction', value: 'none' }))
  })
  it('preserves the existing verdict when headers are absent and reports the actual input', async () => {
    const result = await discoverIndexableRule.run({ html: '', doc: doc(''), url: 'https://example.test' }, { globals: {} })
    expect(result.type).toBe('ok')
    expect(result.presentation?.input).toBe('Static DOM')
    expect(result.presentation?.checked).toContainEqual(expect.objectContaining({ key: 'Header', value: 'Not captured' }))
  })
})
