import { describe, it, expect } from 'vitest'

import { collectDomFacts } from '@/shared/domFacts.collect'
import { validatePhaseMessage } from '@/shared/phaseContract'

const makeDoc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const contract = (html: string) => {
  const facts = collectDomFacts(makeDoc(html), 'static')
  return { facts, check: validatePhaseMessage('document_end', { facts, url: 'https://ex.test/', capturedAt: 0, navTiming: null }) }
}

// The background silently rejects any phase message above 32 KB. The collector
// must therefore budget in the same unit the contract enforces: UTF-8 bytes.
describe('domFacts byte budget matches the phase contract', () => {
  it('keeps a CJK-heavy head inside the 32 KB phase budget', () => {
    const head = Array.from({ length: 60 }, (_, i) => `<meta name="m${i}" content="${'新闻标题描述内容'.repeat(38)}">`).join('')
    const { facts, check } = contract(`<html><head><title>中文</title>${head}</head><body><p>正文</p></body></html>`)
    expect(check.ok).toBe(true)
    // The head cannot fit, so the collector must say so instead of overflowing.
    expect(facts.criticalTruncated).toBe(true)
  })

  it('budgets parameterized links so they cannot push the message over 32 KB', () => {
    const head = Array.from({ length: 400 }, (_, i) => `<meta name="n${i}" content="${'x'.repeat(300)}">`).join('')
    const res = Array.from({ length: 20 }, (_, i) => `<img src="https://x.test/${'r'.repeat(490)}${i}.png">`).join('')
    const params = Array.from({ length: 12 }, (_, i) => `<a href="/p?${'q'.repeat(500)}${i}">l</a>`).join('')
    const { check } = contract(`<html><head><title>T</title>${head}</head><body>${res}${params}</body></html>`)
    expect(check.ok).toBe(true)
  })

  it('budgets emoji-laden document attributes in bytes', () => {
    const attrs = Array.from({ length: 10 }, (_, i) => `data-a${i}="${'🔥'.repeat(120)}"`).join(' ')
    const head = Array.from({ length: 400 }, (_, i) => `<meta name="n${i}" content="${'x'.repeat(300)}">`).join('')
    const { check } = contract(`<html ${attrs}><head><title>T</title>${head}</head><body><p>x</p></body></html>`)
    expect(check.ok).toBe(true)
  })

  it('reserves budget for anchors so a fat head cannot starve them to zero', () => {
    // orf.at shape: ~19 KB head + many scripts exhaust the shared pool before
    // the walk reaches body anchors; internal-link checks then saw zero links.
    const head = Array.from({ length: 60 }, (_, i) => `<meta name="m${i}" content="${'c'.repeat(300)}">`).join('')
    const scripts = Array.from({ length: 30 }, (_, i) => `<script src="https://ex.test/${'s'.repeat(400)}${i}.js"></script>`).join('')
    const anchors = Array.from({ length: 20 }, (_, i) => `<a href="/story${i}">l</a>`).join('')
    const facts = collectDomFacts(makeDoc(`<html><head><title>T</title>${head}</head><body>${scripts}${anchors}</body></html>`), 'static')
    expect(facts.anchorCount).toBe(20)
    expect(facts.elements.filter((fact) => fact.tag === 'a').length).toBeGreaterThan(0)
  })
})
