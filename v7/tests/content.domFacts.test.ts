import { describe, expect, it } from 'vitest'

import { collectDomFacts, domFactsToDocument } from '@/shared/domFacts'

describe('bounded DOM facts', () => {
  it('preserves SEO elements without serializing the complete page', () => {
    document.documentElement.innerHTML = `
      <head><title>Static</title><link rel="canonical" href="https://example.com/"></head>
      <body><h1>Heading</h1><div>${'large text '.repeat(5_000)}</div></body>`

    const facts = collectDomFacts(document, 'static')
    const payload = JSON.stringify(facts)
    const restored = domFactsToDocument(facts, (markup) => new DOMParser().parseFromString(markup, 'text/html'))

    expect(facts).not.toHaveProperty('html')
    expect(payload).not.toContain('large text large text large text')
    expect(restored.title).toBe('Static')
    expect(restored.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://example.com/')
  })

  it('keeps exact counts while bounding link evidence', () => {
    document.body.innerHTML = Array.from(
      { length: 200 },
      (_, index) => `<a href="/item?id=${index}">Item</a>`,
    ).join('')

    const facts = collectDomFacts(document, 'idle')

    expect(facts.parameterizedLinkCount).toBe(200)
    expect(facts.parameterizedLinks.length).toBeLessThanOrEqual(50)
    expect(facts.parameterizedLinksTruncated).toBe(true)
  })

  it('keeps static and idle comparison facts distinct', () => {
    document.body.innerHTML = '<a href="/static?id=1">Static</a>'
    const staticFacts = collectDomFacts(document, 'static')
    document.body.innerHTML = '<a href="/idle?id=2">Idle</a>'
    const idleFacts = collectDomFacts(document, 'idle')

    expect(staticFacts.phase).toBe('static')
    expect(staticFacts.parameterizedLinks).toEqual(['/static?id=1'])
    expect(idleFacts.phase).toBe('idle')
    expect(idleFacts.parameterizedLinks).toEqual(['/idle?id=2'])
  })
})
