import { describe, expect, it } from 'vitest'

import { titleRule } from '@/rules/head/title'
import { titleLengthRule } from '@/rules/head/titleLength'
import { metaDescriptionRule } from '@/rules/head/metaDescription'
import { h1Rule } from '@/rules/body/h1'
import { metaViewportRule } from '@/rules/head/metaViewport'
import { ogImageRule } from '@/rules/og/image'
import { ogTitleRule } from '@/rules/og/title'
import { headersPresentRule } from '@/rules/http/headersPresent'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const page = (html: string, extra: Record<string, unknown> = {}) =>
  ({ html, url: 'https://ex.com/a', doc: doc(html), ...extra }) as never
const ctx = { globals: {} }

describe('verdicts carry the judged value', () => {
  it('head-title shows the title and its length, typed ok', async () => {
    const res = await titleRule.run(page('<head><title>My Fine Title</title></head>'), ctx)
    expect(res.type).toBe('ok')
    expect(res.message).toContain('My Fine Title')
    expect(res.message).toContain('13')
    expect(res.details?.['title']).toBe('My Fine Title')
  })

  it('head:title (length) carries the title as a semantic key', async () => {
    const res = await titleLengthRule.run(page('<head><title>My Fine Title</title></head>'), ctx)
    expect(res.details?.['title']).toBe('My Fine Title')
  })

  it('meta description verdict shows length and value, typed ok', async () => {
    const res = await metaDescriptionRule.run(
      page('<head><meta name="description" content="A concise summary of the page."></head>'),
      ctx,
    )
    expect(res.type).toBe('ok')
    expect(res.message).toContain('30')
    expect(res.message).toContain('A concise summary')
    expect(res.details?.['length']).toBe(30)
  })

  it('body:h1 shows the heading text and carries an h1 key', async () => {
    const res = await h1Rule.run(page('<body><h1>Welcome to the Test</h1></body>'), ctx)
    expect(res.message).toContain('Welcome to the Test')
    expect(res.details?.['h1']).toBe('Welcome to the Test')
  })

  it('meta viewport verdict shows the content value', async () => {
    const res = await metaViewportRule.run(
      page('<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'),
      ctx,
    )
    expect(res.message).toContain('width=device-width')
  })

  it('og:image verdict shows the image URL', async () => {
    const res = await ogImageRule.run(
      page('<head><meta property="og:image" content="https://ex.com/img.jpg"></head>'),
      ctx,
    )
    expect(res.message).toContain('https://ex.com/img.jpg')
    expect(typeof res.priority).toBe('number')
  })

  it('og:title has an explicit priority', async () => {
    const res = await ogTitleRule.run(page('<head><meta property="og:title" content="T"></head>'), ctx)
    expect(typeof res.priority).toBe('number')
  })

  it('http:headers-present reports the header count', async () => {
    const res = await headersPresentRule.run(page('', { headers: { a: '1', b: '2', c: '3' } }), ctx)
    expect(res.message).toContain('3')
    expect(res.details?.['headerCount']).toBe(3)
  })
})
