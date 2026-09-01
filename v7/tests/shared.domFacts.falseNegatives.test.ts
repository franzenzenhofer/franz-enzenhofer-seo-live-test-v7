import { describe, it, expect } from 'vitest'

import { collectDomFacts } from '@/shared/domFacts.collect'
import { domFactsToDocument } from '@/shared/domFacts.document'
import { mixedContentRule } from '@/rules/http/mixedContent'

const makeDoc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const rebuild = (html: string) => {
  const facts = collectDomFacts(makeDoc(html), 'static')
  return { facts, rebuilt: domFactsToDocument(facts, makeDoc) }
}
const runMixed = async (doc: Document) =>
  mixedContentRule.run({ html: '', url: 'https://ex.test/', doc } as never, { globals: {} })

describe('bounded facts must keep every mixed-content offender', () => {
  it('keeps an insecure stylesheet <link> in <body>', async () => {
    const { facts, rebuilt } = rebuild(
      '<html><head><title>T</title></head><body><link rel="stylesheet" href="http://insecure.test/s.css"><p>x</p></body></html>',
    )
    expect(facts.criticalTruncated).toBe(false)
    expect(rebuilt.querySelector('link[href^="http://"]')).toBeTruthy()
    const result = await runMixed(rebuilt)
    expect(result.type).toBe('error')
  })

  it('keeps an insecure <object data> past the 20-resource sampling cap', async () => {
    const many = Array.from({ length: 25 }, (_, i) => `<img src="https://ex.test/i${i}.png">`).join('')
    const { facts, rebuilt } = rebuild(
      `<html><head><title>T</title></head><body>${many}<object data="http://insecure.test/o.swf"></object></body></html>`,
    )
    expect(facts.criticalTruncated).toBe(false)
    expect(rebuilt.querySelector('object[data^="http://"]')).toBeTruthy()
    const result = await runMixed(rebuilt)
    expect(result.type).toBe('error')
  })

  it('keeps an insecure stylesheet <link> in <head> past the 150-element head cap', async () => {
    const filler = Array.from({ length: 155 }, (_, i) => `<link rel="preload" as="style" href="https://ex.test/f${i}.css">`).join('')
    const { facts, rebuilt } = rebuild(
      `<html><head><title>T</title>${filler}<link rel="stylesheet" href="http://insecure.test/s.css"></head><body><p>x</p></body></html>`,
    )
    expect(facts.criticalTruncated).toBe(false)
    expect(rebuilt.querySelector('link[href^="http://"]')).toBeTruthy()
    const result = await runMixed(rebuilt)
    expect(result.type).toBe('error')
  })
})

describe('bounded facts must not corrupt verdict-deciding attribute values', () => {
  it('keeps a long canonical href intact instead of clamping it to 512 chars', () => {
    const href = `https://ex.test/products?filter=${'a'.repeat(700)}`
    const { facts, rebuilt } = rebuild(
      `<html><head><title>T</title><link rel="canonical" href="${href}"></head><body><p>x</p></body></html>`,
    )
    expect(facts.criticalTruncated).toBe(false)
    expect(rebuilt.querySelector('link[rel~="canonical" i]')?.getAttribute('href')).toBe(href)
  })

  it('flags criticalTruncated when a canonical href exceeds even the critical clamp', () => {
    const href = `https://ex.test/p?x=${'a'.repeat(3000)}`
    const { facts } = rebuild(
      `<html><head><title>T</title><link rel="canonical" href="${href}"></head><body><p>x</p></body></html>`,
    )
    expect(facts.criticalTruncated).toBe(true)
  })
})
