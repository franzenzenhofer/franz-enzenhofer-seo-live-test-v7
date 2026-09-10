import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { discoverMaxImagePreviewLargeRule } from '@/rules/discover/maxImagePreviewLarge'
import { enrichResult } from '@/core/runHelpers'
import { ResultDetails } from '@/components/result/ResultDetails'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const run = async (html: string, headers: Record<string, string> = {}) => enrichResult(await discoverMaxImagePreviewLargeRule.run({
  html, doc: new DOMParser().parseFromString(html, 'text/html'), headers, url: 'https://example.test',
}, { globals: {} }), discoverMaxImagePreviewLargeRule, 'test')

describe('Discover large image preview permission', () => {
  it('identifies the restrictive header and preserves all conflicting sources in display and copy', async () => {
    const result = await run('<meta name="robots" content="max-image-preview:large">', { 'X-Robots-Tag': 'googlebot: max-image-preview:standard' })
    expect(result.type).toBe('warn')
    expect(result.message).toContain('standard size')
    expect(result.details?.['previewInstructions']).toHaveLength(2)
    const expanded = renderToStaticMarkup(<ResultDetails details={result.details} />)
    expect(expanded).toContain('HTTP response header')
    expect(expanded).toContain('Preserve unrelated instructions')
    expect(toResultCopyPayload(result)).toContain('max-image-preview:standard')
    expect(expanded).not.toContain('[object Object]')
  })
  it('distinguishes missing permission from an explicit ban', async () => {
    expect((await run('')).message).toContain('not explicitly enabled')
    expect((await run('<meta name="robots" content="max-image-preview:none">')).message).toContain('no preview')
    expect((await run('<meta name="robots" content="max-image-preview:large, noimageindex">')).message).toContain('restricted by noimageindex')
  })
  it('allows large previews with nosnippet and ignores unrelated crawler restrictions', async () => {
    const result = await run('<meta name="googlebot" content="max-image-preview:large, nosnippet"><meta name="bingbot" content="noimageindex"><meta name="googlebot-news" content="max-image-preview:none">')
    expect(result.type).toBe('ok')
    expect(result.details?.['previewInstructions']).toHaveLength(1)
    expect(result.details?.['nextStep']).toBeUndefined()
  })
})
