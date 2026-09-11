import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { seoPhaseChangesRule as rule } from '@/rules/dom/seoPhaseChanges'
import { presentationSchema } from '@/shared/presentation/schema'
import { collectSeoPhaseSignals } from '@/shared/seoPhaseSignals'

const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const facts = (html: string) => ({ seoSignals: collectSeoPhaseSignals(doc(html)) })
const run = async (staticHtml?: string, idleHtml?: string) => enrichResult(await rule.run({
  html: '', url: 'https://ex.test/', doc: doc(''),
  ...(staticHtml === undefined ? {} : { staticFacts: facts(staticHtml) }),
  ...(idleHtml === undefined ? {} : { idleFacts: facts(idleHtml) }),
} as never, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('rule: SEO elements across DOM phases', () => {
  it('names the element groups that changed between the phases', async () => {
    const before = '<head><title>A</title><link rel="canonical" href="https://ex.test/a"></head><body><h1>One</h1></body>'
    const after = '<head><title>A</title><link rel="canonical" href="https://ex.test/b"></head><body><h1>One</h1><h2>Two</h2></body>'
    const result = await run(before, after)
    expect(result.type).toBe('info'); expect(result.priority).toBe(750)
    expect(detail(result, 'Changed groups')).toContain('canonical')
    expect(detail(result, 'Changed groups')).toContain('headings')
    expect(detail(result, 'Changed groups')).not.toContain('title')
    expect(value(result, 'SEO element groups changed')).toBe(2)
    expect(result.presentation?.input).toBe('Static DOM + Idle DOM')
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('reports no change when both phases carry the same elements', async () => {
    const html = '<head><title>A</title></head><body><h1>One</h1></body>'
    const result = await run(html, html)
    expect(value(result, 'SEO element groups changed')).toBe(0)
    expect(detail(result, 'Changed groups')).toBe('None')
  })

  it('is unavailable - not falsely "unchanged" - when a phase is missing', async () => {
    const result = await run('<title>A</title>', undefined)
    expect(result.type).toBe('info'); expect(result.priority).toBe(750)
    expect(result.presentation?.input).toBe('Static DOM')
    expect(value(result, 'Idle DOM facts')).toBe('Not captured')
    expect(result.presentation?.values.find((field) => field.key === 'SEO element groups changed')).toBeUndefined()
  })

  it('never claims a source-HTML or JavaScript-disabled comparison', async () => {
    const html = '<title>A</title>'
    const result = await run(html, html)
    const checkedText = result.presentation?.checked.map((field) => field.value).join(' ') || ''
    expect(checkedText).toContain('not source HTML or JavaScript-disabled rendering')
  })
})
