import { describe, it, expect } from 'vitest'
import { metaUnavailableAfterRule } from '@/rules/head/metaUnavailableAfter'

const facts = (metas: Array<[string, string] | [string]> = []) => ({
  phase: 'static', nodeCount: 1, maxDepth: 1, textLength: 0,
  scriptCount: 0, blockingScriptCount: 0, parameterizedLinkCount: 0,
  parameterizedLinks: [], parameterizedLinksTruncated: false,
  elements: metas.map(([name, content]) => ({
    location: 'head',
    tag: 'meta',
    attrs: content === undefined ? [['content', name]] : [['name', name], ['content', content]],
  })),
  elementsTruncated: false, documentAttributes: [],
})

const page = (metas: Array<[string, string] | [string]> = []) =>
  ({ staticFacts: facts(metas), idleFacts: { ...facts(metas), phase: 'idle' } })

const run = (metas: Array<[string, string] | [string]> = []) =>
  metaUnavailableAfterRule.run(page(metas) as any, { globals: {} })

describe('rule: meta unavailable_after', () => {
  it('reports absence as info', async () => {
    const r = await run()
    expect((r as any).type).toBe('info')
  })

  it('warns when present in future', async () => {
    const r = await run([['robots', 'unavailable_after: 25 Jun 2050 15:00:00 GMT']])
    expect((r as any).type).toBe('warn')
  })

  it('errors when date is in the past', async () => {
    const r = await run([['robots', 'unavailable_after: 25 Jun 2000 15:00:00 GMT']])
    expect((r as any).type).toBe('error')
  })

  it('detects the directive combined with other rules', async () => {
    const r = await run([['robots', 'noindex, unavailable_after: 25 Jun 2000 15:00:00 GMT']])
    expect((r as any).type).toBe('error')
    expect(((r as any).details as any).past).toBe(true)
  })

  it('parses RFC 822 dates containing a comma', async () => {
    const r = await run([['robots', 'unavailable_after: Fri, 25 Jun 2049 15:00:00 GMT']])
    expect((r as any).type).toBe('warn')
    expect(((r as any).details as any).parsed[0].timestamp).not.toBeNull()
  })

  it('accepts crawler-named metas like googlebot', async () => {
    const r = await run([['googlebot', 'unavailable_after: 25 Jun 2000 15:00:00 GMT']])
    expect((r as any).type).toBe('error')
  })

  it('ignores metas without a name attribute', async () => {
    const r = await run([['unavailable_after: 25 Jun 2000 15:00:00 GMT']])
    expect((r as any).type).toBe('info')
  })

  it('warns without asserting removal when the date is unparseable', async () => {
    const r = await run([['robots', 'unavailable_after: not-a-date']])
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toMatch(/ignores the rule/)
  })
})
