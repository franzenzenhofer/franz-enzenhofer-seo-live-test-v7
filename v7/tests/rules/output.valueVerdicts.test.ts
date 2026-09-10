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
  it('head-title reports the length and carries the title as a value key', async () => {
    const res = await titleRule.run(page('<head><title>My Fine Title</title></head>'), ctx)
    expect(res.type).toBe('ok')
    expect(res.presentation?.detailValues).toContainEqual({ key: 'Trimmed length (UTF-16 code units)', value: 13, kind: 'text' })
    expect(res.message).not.toContain('My Fine Title')
    expect(res.presentation?.detailValues).toContainEqual({ key: 'Title', value: 'My Fine Title', kind: 'text' })
  })

  it('head:title (length) carries the title as a semantic key', async () => {
    const res = await titleLengthRule.run(page('<head><title>My Fine Title</title></head>'), ctx)
    expect(res.presentation?.detailValues).toContainEqual({ key: 'Title', value: 'My Fine Title', kind: 'text' })
  })

  it('meta description verdict reports length; value lives in the description key', async () => {
    const res = await metaDescriptionRule.run(
      page('<head><meta name="description" content="A concise summary of the page."></head>'),
      ctx,
    )
    expect(res.type).toBe('ok')
    expect(res.presentation?.values).toContainEqual({ key: 'Characters', value: 30, kind: 'text' })
    expect(res.message).not.toContain('A concise summary')
    expect(res.presentation?.detailValues).toContainEqual({ key: 'Description', value: 'A concise summary of the page.', kind: 'text' })
    expect(res.presentation?.markup[0].value).toContain('content="A concise summary of the page."')
  })

  it('body:h1 carries the heading text under the h1 key', async () => {
    const res = await h1Rule.run(page('<body><h1>Welcome to the Test</h1></body>'), ctx)
    expect(res.presentation?.values[0].value).toBe(1)
    expect(res.presentation?.detailValues).toContainEqual({ key: 'Heading text', value: 'Welcome to the Test', kind: 'text' })
  })

  it('meta viewport carries the content value in its key', async () => {
    const res = await metaViewportRule.run(
      page('<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'),
      ctx,
    )
    expect(res.details?.['content']).toBe('width=device-width, initial-scale=1')
  })

  it('og:image carries the image URL in its key', async () => {
    const res = await ogImageRule.run(
      page('<head><meta property="og:image" content="https://ex.com/img.jpg"></head>'),
      ctx,
    )
    expect(res.details?.['ogImage']).toBe('https://ex.com/img.jpg')
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
