import { describe, it, expect } from 'vitest'
import { metaUnavailableAfterRule } from '@/rules/head/metaUnavailableAfter'

const facts = (metas: Array<[string, string] | [string]> = []) => ({
  phase: 'static', nodeCount: 1, maxDepth: 1, textLength: 0,
  scriptCount: 0, blockingScriptCount: 0, anchorCount: 0, parameterizedLinkCount: 0,
  parameterizedLinks: [], parameterizedLinksTruncated: false,
  elements: metas.map(([name, content]) => ({
    location: 'head',
    tag: 'meta',
    attrs: content === undefined ? [['content', name]] : [['name', name], ['content', content]],
  })),
  elementsTruncated: false, truncatedBuckets: [], criticalTruncated: false, documentAttributes: [],
})

const page = (metas: Array<[string, string] | [string]> = []) =>
  ({ url: 'https://example.test/', staticFacts: facts(metas), idleFacts: { ...facts(metas), phase: 'idle' } })

const run = (metas: Array<[string, string] | [string]> = []) =>
  metaUnavailableAfterRule.run(page(metas) as any, { globals: {} })

describe('rule: meta unavailable_after', () => {
  it('reports absence as info', async () => {
    const r = await run()
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(r.presentation?.values).toContainEqual({ key: 'unavailable_after directives', value: 0, kind: 'text' })
    expect(r.presentation?.noMarkup).toBe('No unavailable_after directive found in robots meta tags')
    expect(r.label).toBe('HEAD')
  })

  it('warns when present in future', async () => {
    const r = await run([['robots', 'unavailable_after: 25 Jun 2050 15:00:00 GMT']])
    expect(r.type).toBe('warn'); expect(r.priority).toBe(300)
    expect(r.presentation?.values).toContainEqual({ key: 'Date state', value: 'Not in the past', kind: 'text' })
  })

  it('errors when date is in the past', async () => {
    const r = await run([['robots', 'unavailable_after: 25 Jun 2000 15:00:00 GMT']])
    expect(r.type).toBe('error'); expect(r.priority).toBe(80)
    expect(r.presentation?.values).toContainEqual({ key: 'Date state', value: 'Past', kind: 'text' })
  })

  it('detects the directive combined with other rules', async () => {
    const r = await run([['robots', 'noindex, unavailable_after: 25 Jun 2000 15:00:00 GMT']])
    expect(r.type).toBe('error')
    expect(r.presentation?.values).toContainEqual({ key: 'Date state', value: 'Past', kind: 'text' })
    expect(r.details).toBeUndefined()
  })

  it('parses RFC 822 dates containing a comma', async () => {
    const r = await run([['robots', 'unavailable_after: Fri, 25 Jun 2049 15:00:00 GMT']])
    expect(r.type).toBe('warn')
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Parsed date', value: 'Fri, 25 Jun 2049 15:00:00 GMT', kind: 'text' })
  })

  it('accepts crawler-named metas like googlebot', async () => {
    const r = await run([['googlebot', 'unavailable_after: 25 Jun 2000 15:00:00 GMT']])
    expect(r.type).toBe('error')
  })

  it('ignores metas without a name attribute', async () => {
    const r = await run([['unavailable_after: 25 Jun 2000 15:00:00 GMT']])
    expect(r.type).toBe('info')
  })

  it('warns without falsely asserting removal when the date is unparseable', async () => {
    const r = await run([['robots', 'unavailable_after: not-a-date']])
    expect(r.type).toBe('warn')
    expect(r.presentation?.values).toContainEqual({ key: 'Date state', value: 'Unparseable', kind: 'text' })
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Parsed date', value: 'Not parseable', kind: 'text' })
    expect(r.presentation?.checked).toContainEqual({ key: 'Criterion', value: 'A parsed date already in the past is an error; an unparseable date is ignored by Google and is a warning', kind: 'text' })
  })

  it('deduplicates the same declared value across static and idle facts', async () => {
    const r = await run([['robots', 'unavailable_after: 25 Jun 2050 15:00:00 GMT']])
    expect(r.presentation?.values).toContainEqual({ key: 'unavailable_after directives', value: 1, kind: 'text' })
    expect(r.presentation?.evidence).toHaveLength(1)
  })
})
