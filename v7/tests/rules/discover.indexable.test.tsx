import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { discoverIndexableRule } from '@/rules/discover/indexable'
import { collectDomFacts } from '@/shared/domFacts.collect'
import { domFactsToDocument } from '@/shared/domFacts.document'
import { enrichResult } from '@/core/runHelpers'
import { ResultDetails } from '@/components/result/ResultDetails'
import { toResultCopyPayload } from '@/components/result/resultCopy'
import { resultPreview } from '@/shared/resultPreview'

const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const run = async (html: string, headers: Record<string, string> = {}) => enrichResult(await discoverIndexableRule.run({
  html, doc: domFactsToDocument(collectDomFacts(doc(html), 'static'), doc), headers, url: 'https://example.test',
}, { globals: {} }), discoverIndexableRule, 'test')

describe('Discover indexing permission', () => {
  it('names all blockers, including body meta tags, without unrelated robots flags', async () => {
    const result = await run('<meta name="robots" content="index"><body><meta name="googlebot" content="noindex, nofollow"></body>', { 'X-Robots-Tag': 'none' })
    expect(result.type).toBe('warn')
    expect(result.details?.['blockingInstructions']).toHaveLength(2)
    const expanded = renderToStaticMarkup(<ResultDetails details={result.details} />)
    expect(expanded).toContain('Googlebot')
    expect(expanded).toContain('HTML meta tag')
    expect(expanded).toContain('HTTP response header')
    expect(expanded).toContain('Keep the restriction if exclusion is intentional')
    expect(expanded).not.toContain('Blocks image indexing')
    expect(resultPreview(result.details)).toContain('noindex, nofollow')
    const copy = toResultCopyPayload(result)
    expect(copy).toContain('noindex, nofollow')
    expect(copy).toContain('X-Robots-Tag')
    expect(copy).not.toContain('[object Object]')
  })
  it('ignores restrictions aimed only at other crawlers and does not claim actual indexing', async () => {
    const result = await run('<meta name="bingbot" content="noindex">')
    expect(result.type).toBe('ok')
    expect(result.details?.['interpretation']).toContain('not actual index status')
    expect(result.details?.['nextStep']).toBeUndefined()
  })
  it('treats none as blocking, even beside index', async () => {
    const result = await run('<meta name="robots" content="none"><meta name="googlebot" content="index">')
    expect(result.type).toBe('warn')
    expect(resultPreview(result.details)).toContain('none')
  })
})
