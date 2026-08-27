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
    expect(new TextEncoder().encode(payload).length).toBeLessThan(32_000)
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
    expect(facts.parameterizedLinks.length).toBeLessThanOrEqual(12)
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

  it('keeps adversarial attribute payloads below the runtime message budget', () => {
    const value = 'x'.repeat(10_000)
    document.head.innerHTML = Array.from({ length: 200 }, (_, index) =>
      `<meta name="item-${index}" content="${value}">`).join('')

    const facts = collectDomFacts(document, 'static')

    expect(new TextEncoder().encode(JSON.stringify({ event: 'document_end', data: { facts } })).length).toBeLessThan(32_000)
    expect(facts.elementsTruncated).toBe(true)
  })

  it('bounds a generated 100,000-element DOM with 20,000 parameterized links', () => {
    document.documentElement.innerHTML = '<head></head><body></body>'
    const fragment = document.createDocumentFragment()
    for (let index = 0; index < 100_000; index++) {
      const element = document.createElement(index < 20_000 ? 'a' : 'div')
      if (element instanceof HTMLAnchorElement) element.setAttribute('href', `/item?id=${index}`)
      fragment.append(element)
    }
    document.body.append(fragment)

    const facts = collectDomFacts(document, 'idle')
    const message = { event: 'document_idle', data: { facts } }

    expect(facts.nodeCount).toBe(100_003)
    expect(facts.parameterizedLinkCount).toBe(20_000)
    expect(facts.parameterizedLinks).toHaveLength(12)
    expect(facts.parameterizedLinksTruncated).toBe(true)
    expect(JSON.stringify(message)).not.toContain('<html')
    expect(new TextEncoder().encode(JSON.stringify(message)).length).toBeLessThan(32_000)
    document.body.replaceChildren()
  }, 30_000)
})
