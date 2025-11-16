import { describe, it, expect } from 'vitest'

import { h1Rule } from '@/rules/body/h1'

const SPEC = 'https://developers.google.com/style/headings?hl=en'
const D = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const run = (html: string) =>
  h1Rule.run({ html, url: 'https://example.com', doc: D(html) } as any, { globals: {} })

describe('body:h1 rule', () => {
  it('reports the single H1 with cleaned snippet and dom path', async () => {
    const html = '<h1 class="hero"><a class="link" href="/a">SEO <em>Works</em></a></h1>'
    const result = await run(html)
    expect(result.message).toBe('1 <h1> found.')
    expect(result.details?.snippet).toBe('<h1><a>SEO <em>Works</em></a></h1>')
    expect(result.details?.sourceHtml).toBe(html)
    expect(result.details?.domPath).toBe('h1')
    expect(result.details?.reference).toBe(SPEC)
  })

  it('warns when multiple h1 elements are present', async () => {
    const result = await run('<h1>One</h1><h1>Two</h1>')
    expect(result.type).toBe('warn')
    expect(result.message).toBe('2 <h1> elements found.')
    expect(result.details?.domPaths).toEqual(['h1', 'h1:nth-of-type(2)'])
    expect(result.details?.reference).toBe(SPEC)
  })

  it('warns when h1 is missing', async () => {
    const result = await run('<p>No headings here</p>')
    expect(result.type).toBe('warn')
    expect(result.message).toBe('No <h1> found.')
    expect(result.details?.reference).toBe(SPEC)
  })

  it('warns when the only h1 has no text content', async () => {
    const result = await run('<h1><span>   </span></h1>')
    expect(result.type).toBe('warn')
    expect(result.message).toBe('<h1> is empty.')
    expect(result.details?.snippet).toBe('<h1></h1>')
    expect(result.details?.domPath).toBe('h1')
    expect(result.details?.reference).toBe(SPEC)
  })
})
