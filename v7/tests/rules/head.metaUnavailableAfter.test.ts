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
    expect(r.presentation?.values).toEqual([{ key: 'unavailable_after', value: 'Not found', kind: 'text' }])
    expect(r.presentation?.noMarkup).toBe('No unavailable_after directive found in robots meta tags')
    expect(r.label).toBe('HEAD')
  })

  it('warns when present in future', async () => {
    const r = await run([['robots', 'unavailable_after: 25 Jun 2050 15:00:00 GMT']])
    expect(r.type).toBe('warn'); expect(r.priority).toBe(300)
    expect(r.presentation?.values).toEqual([{ key: 'unavailable_after', value: '25 Jun 2050 15:00:00 GMT', kind: 'text' }, { key: 'Date state', value: 'Future', kind: 'text' }])
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
    expect(r.presentation?.evidence[0]?.name).toBe('<meta name="robots">')
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Parsed date', value: 'Fri, 25 Jun 2049 15:00:00 GMT', kind: 'text' })
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Markup', value: 'Not captured', kind: 'text' })
    expect(r.presentation?.detailValues).toEqual([{ key: 'Markup retained', value: 0, kind: 'text' }, { key: 'Markup omitted', value: 1, kind: 'text' },
      { key: 'Evidence retained', value: 1, kind: 'text' }, { key: 'Evidence omitted', value: 0, kind: 'text' }])
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
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Parsed date', value: 'Unparseable', kind: 'text' })
    expect(r.presentation?.checked).toContainEqual({ key: 'Criterion', value: 'A parsed date already in the past is an error; an unparseable date is ignored by Google and is a warning', kind: 'text' })
  })

  it('deduplicates the same declared value across static and idle facts', async () => {
    const r = await run([['robots', 'unavailable_after: 25 Jun 2050 15:00:00 GMT']])
    expect(r.presentation?.values.find((f) => f.key === 'Directives')).toBeUndefined()
    expect(r.presentation?.evidence).toHaveLength(1)
  })

  it('numbers repeated tag labels and shows retained original markup in the overview', async () => {
    const original = (html: string, selector: string) => ({ html, selector })
    const p = page([['robots', 'unavailable_after: 25 Jun 2050 15:00:00 GMT'], ['googlebot', 'unavailable_after: 25 Jun 2051 15:00:00 GMT'], ['robots', 'unavailable_after: 25 Jun 2052 15:00:00 GMT']])
    p.staticFacts.elements[0]!.original = original('<meta name="robots" content="unavailable_after: 25 Jun 2050 15:00:00 GMT">', 'html > head > meta:nth-of-type(1)')
    p.staticFacts.elements[2]!.original = original('<meta name="robots" content="unavailable_after: 25 Jun 2052 15:00:00 GMT">', 'html > head > meta:nth-of-type(3)')
    const r = await metaUnavailableAfterRule.run(p as any, { globals: {} })
    expect(r.presentation?.values.map((f) => f.key)).toEqual(['Directives', 'unavailable_after', 'Date state', '<meta name="robots"> 1', '<meta name="robots"> 2'])
    expect(r.presentation?.evidence.map((record) => record.name)).toEqual(['<meta name="robots"> 1', '<meta name="googlebot">', '<meta name="robots"> 2'])
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'DOM path', value: 'html > head > meta:nth-of-type(1)', kind: 'path' })
    expect(r.presentation?.detailValues).toEqual([{ key: 'Markup retained', value: 2, kind: 'text' }, { key: 'Markup omitted', value: 1, kind: 'text' },
      { key: 'Evidence retained', value: 3, kind: 'text' }, { key: 'Evidence omitted', value: 0, kind: 'text' }])
  })

  it('declares the unavailable input once when facts are missing', async () => {
    const r = await metaUnavailableAfterRule.run({ url: 'https://example.test/' } as any, { globals: {} })
    expect(r.type).toBe('runtime_error'); expect(r.priority).toBe(900)
    expect(r.presentation?.input).toBe('Not captured')
    expect(r.presentation?.values).toEqual([{ key: 'unavailable_after', value: 'Not captured', kind: 'text' }])
  })
})
