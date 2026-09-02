import { describe, it, expect } from 'vitest'
import { discoverMaxImagePreviewLargeRule } from '@/rules/discover/maxImagePreviewLarge'
import { discoverArticleStructuredDataRule } from '@/rules/discover/articleStructuredData'
import { discoverPublishedTimeRule } from '@/rules/discover/publishedTime'
import { discoverAuthorPresentRule } from '@/rules/discover/authorPresent'
import { discoverHeadlineLengthRule } from '@/rules/discover/headlineLength'
import { discoverIndexableRule } from '@/rules/discover/indexable'
import { discoverOgImageLargeRule } from '@/rules/discover/ogImageLarge'
import { discoverPrimaryLanguageRule } from '@/rules/discover/primaryLanguage'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('discover rules', () => {
  it('max-image-preview:large via meta', async () => {
    const p = { html:'', url:'https://ex.com', doc: D('<meta name="robots" content="max-image-preview:large">') }
    const r = await discoverMaxImagePreviewLargeRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
  it('article structured data present', async () => {
    const p = { html:'', url:'', doc: D('<script type="application/ld+json">{"@type":"Article"}</script>') }
    const r = await discoverArticleStructuredDataRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
  it('published time', async () => {
    const p = { html:'', url:'', doc: D('<meta property="article:published_time" content="2024-01-01">') }
    const r = await discoverPublishedTimeRule.run(p as any, { globals: {} })
    expect((r as any).message.includes('Published')).toBe(true)
  })
  it('author present', async () => {
    const p = { html:'', url:'', doc: D('<meta name="author" content="Jane">') }
    const r = await discoverAuthorPresentRule.run(p as any, { globals: {} })
    expect((r as any).message.includes('Author')).toBe(true)
  })
  it('headline present is ok without implying a spec minimum', async () => {
    const p = { html:'', url:'', doc: D('<h1>This is a suitable headline</h1>') }
    const r = await discoverHeadlineLengthRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('ok')
    expect((r as any).message.includes('>=20')).toBe(false)
  })
  it('short headline is info and labeled as heuristic', async () => {
    const p = { html:'', url:'', doc: D('<h1>Short one</h1>') }
    const r = await discoverHeadlineLengthRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).message.toLowerCase().includes('heuristic')).toBe(true)
  })
  it('indexable ok', async () => {
    const p = { html:'', url:'', doc: D('<p/>') }
    const r = await discoverIndexableRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
  it("treats robots 'none' as noindex per Google's robots-meta-tag doc", async () => {
    const p = { html:'', url:'', doc: D('<meta name="robots" content="none">') }
    const r = await discoverIndexableRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it("treats X-Robots-Tag 'none' as noindex", async () => {
    const p = { html:'', url:'', doc: D('<p/>'), headers: { 'x-robots-tag': 'none' } }
    const r = await discoverIndexableRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('og image wide enough via width metadata', async () => {
    const p = { html:'', url:'', doc: D('<meta property="og:image" content="https://ex.com/a.jpg"><meta property="og:image:width" content="2000">') }
    const r = await discoverOgImageLargeRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
  it('og image 1280x720 passes width and total-pixel checks', async () => {
    const p = { html:'', url:'', doc: D('<meta property="og:image" content="https://ex.com/a.jpg"><meta property="og:image:width" content="1280"><meta property="og:image:height" content="720">') }
    const r = await discoverOgImageLargeRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
  it('og image 400x1200 portrait fails the 1200px width requirement', async () => {
    const p = { html:'', url:'', doc: D('<meta property="og:image" content="https://ex.com/a.jpg"><meta property="og:image:width" content="400"><meta property="og:image:height" content="1200">') }
    const r = await discoverOgImageLargeRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('og image 1200x200 fails the 300,000 total-pixel requirement', async () => {
    const p = { html:'', url:'', doc: D('<meta property="og:image" content="https://ex.com/a.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="200">') }
    const r = await discoverOgImageLargeRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('primary language present', async () => {
    const p = { html:'', url:'', doc: D('<html lang="en"><body></body></html>') }
    const r = await discoverPrimaryLanguageRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(String((r as any).details.note)).toContain('visible content')
  })
  it('missing lang warns as accessibility issue, not a Google signal', async () => {
    const p = { html:'', url:'', doc: D('<p>hi</p>') }
    const r = await discoverPrimaryLanguageRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect(String((r as any).details.note)).toContain('visible content')
  })
})
