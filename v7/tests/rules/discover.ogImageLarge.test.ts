import { describe, expect, it } from 'vitest'
import { discoverOgImageLargeRule as rule } from '@/rules/discover/ogImageLarge'
const run = (html: string) => rule.run({ html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
const image = '<meta property="og:image" data-source="cms" content="https://example.test/photo.jpg">'
const size = (w: string, h?: string) => `<meta property="og:image:width" content="${w}">${h === undefined ? '' : `<meta property="og:image:height" content="${h}">`}`
describe('Open Graph image dimensions', () => {
  it('requires both valid dimensions and enforces the exact threshold boundaries', async () => {
    for (const [w, h, type] of [['1200', '250', 'warn'], ['1200', '251', 'ok'], ['1199', '900', 'warn'], ['1200garbage', '600', 'warn'], ['1200', '0', 'warn']]) {
      expect((await run(image + size(w, h))).type).toBe(type)
    }
    expect((await run(image + size('2000'))).type).toBe('warn')
    expect((await run('')).type).toBe('warn')
  })
  it('does not borrow the second image’s dimensions for the first image', async () => {
    const r = await run(image + '<meta property="og:image" content="/second.jpg">' + size('1280', '720'))
    expect(r.type).toBe('warn'); expect(r.presentation?.values[0].value).toBe('Not declared')
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Declared images', value: 2, kind: 'text' })
  })
  it('retains every sampled original tag, associated URL and documentation reference', async () => {
    const r = await run(image + size('1280', '720'))
    expect(r.type).toBe('ok'); expect(r.presentation?.markup[0].value).toBe(image)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Calculated area', value: '921600 px²', kind: 'text' })
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
