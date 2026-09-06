import { describe, expect, it } from 'vitest'

import { seoPhaseChangesRule } from '@/rules/dom/seoPhaseChanges'
import { collectSeoPhaseSignals } from '@/shared/seoPhaseSignals'

const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const facts = (html: string) => ({ seoSignals: collectSeoPhaseSignals(doc(html)) })
const run = (staticHtml?: string, idleHtml?: string) => seoPhaseChangesRule.run({
  html: '', url: 'https://ex.test/', doc: doc(''),
  ...(staticHtml === undefined ? {} : { staticFacts: facts(staticHtml) }),
  ...(idleHtml === undefined ? {} : { idleFacts: facts(idleHtml) }),
} as never, { globals: {} })

describe('rule: SEO elements across DOM phases', () => {
  it('names the element groups that changed between the phases', async () => {
    const before = '<head><title>A</title><link rel="canonical" href="https://ex.test/a"></head><body><h1>One</h1></body>'
    const after = '<head><title>A</title><link rel="canonical" href="https://ex.test/b"></head><body><h1>One</h1><h2>Two</h2></body>'
    const r = await run(before, after)
    const changed = r.details?.['changed'] as string[]
    expect(changed).toContain('canonical')
    expect(changed).toContain('headings')
    expect(changed).not.toContain('title')
    expect(r.message).toContain('changed between document_end and document_idle')
  })

  it('reports no change when both phases carry the same elements', async () => {
    const html = '<head><title>A</title></head><body><h1>One</h1></body>'
    const r = await run(html, html)
    expect(r.details?.['changed']).toEqual([])
    expect(r.message).toContain('unchanged')
  })

  it('is unavailable - never "unchanged" - when a phase is missing', async () => {
    const r = await run('<title>A</title>', undefined)
    expect(r.message).toContain('unavailable')
    expect(r.details?.['changed']).toBeUndefined()
  })

  it('never claims a source-HTML or JavaScript-disabled comparison', async () => {
    const html = '<title>A</title>'
    const r = await run(html, html)
    expect(r.details?.['tested']).toContain('not source HTML or JavaScript-disabled rendering')
  })
})
