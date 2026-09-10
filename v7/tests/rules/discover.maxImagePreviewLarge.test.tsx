import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { discoverMaxImagePreviewLargeRule as rule } from '@/rules/discover/maxImagePreviewLarge'
import { enrichResult } from '@/core/runHelpers'
import { ResultCard } from '@/components/result/ResultCard'
import { toResultCopyPayload } from '@/components/result/resultCopy'
const run = async (html: string, headers: Record<string, string> = {}) => enrichResult(await rule.run({ html, doc: new DOMParser().parseFromString(html, 'text/html'), headers, url: 'https://example.test' }, { globals: {} }), rule, 'test')
describe('large image preview permission', () => {
  it('retains conflicting meta and header instructions with full original markup and all references', async () => {
    const html = '<meta name="robots" data-origin="cms" content="max-image-preview:large">'
    const r = await run(html, { 'X-Robots-Tag': 'googlebot: max-image-preview:standard' })
    expect(r.type).toBe('warn'); expect(r.presentation?.values[0].value).toBe('standard')
    expect(r.presentation?.markup[0].value).toBe(html)
    expect(r.presentation?.evidence).toHaveLength(3)
    const rendered = renderToStaticMarkup(<ResultCard result={r} defaultExpanded />)
    expect(rendered).toContain('HTTP response header'); expect(rendered).not.toContain('[object Object]')
    expect(rendered).not.toContain('Next step'); expect(rendered).not.toContain('What it means')
    for (const url of rule.meta.references) expect(toResultCopyPayload(r)).toContain(url)
  })
  it('distinguishes missing, explicitly none, and noimageindex', async () => {
    expect((await run('')).presentation?.values[0].value).toBe('Not declared in checked input')
    expect((await run('<meta name="robots" content="max-image-preview:none">')).presentation?.values[0].value).toBe('none')
    expect((await run('<meta name="robots" content="max-image-preview:large,noimageindex">')).type).toBe('warn')
  })
  it('does not infer restrictions from unrelated crawlers or nosnippet', async () => {
    const r = await run('<meta name="googlebot" content="max-image-preview:large,nosnippet"><meta name="bingbot" content="noimageindex"><meta name="googlebot-news" content="max-image-preview:none">')
    expect(r.type).toBe('ok'); expect(r.presentation?.markup).toHaveLength(1)
  })
  it('does not claim a combined pass when response headers were not captured', async () => {
    const r = await rule.run({ html: '', url: 'https://example.test/', doc: new DOMParser().parseFromString('<meta name="robots" content="max-image-preview:large">', 'text/html') }, { globals: {} })
    expect(r.type).toBe('runtime_error'); expect(r.presentation?.input).toBe('Static DOM')
  })
})
