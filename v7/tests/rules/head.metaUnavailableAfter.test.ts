import { describe, it, expect } from 'vitest'
import { metaUnavailableAfterRule } from '@/rules/head/metaUnavailableAfter'

const facts = (content?: string) => ({
  phase: 'static', nodeCount: 1, maxDepth: 1, textLength: 0,
  scriptCount: 0, blockingScriptCount: 0, parameterizedLinkCount: 0,
  parameterizedLinks: [], parameterizedLinksTruncated: false,
  elements: content ? [{ location: 'head', tag: 'meta', attrs: [['content', content]] }] : [],
  elementsTruncated: false, documentAttributes: [],
})

const page = (content?: string) => ({ staticFacts: facts(content), idleFacts: { ...facts(content), phase: 'idle' } })

describe('rule: meta unavailable_after', () => {
  it('reports absence as info', async () => {
    const r = await metaUnavailableAfterRule.run(page() as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('warns when present in future', async () => {
    const r = await metaUnavailableAfterRule.run(page('unavailable_after: 25 Jun 2050 15:00:00 GMT') as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('errors when date is in the past', async () => {
    const r = await metaUnavailableAfterRule.run(page('unavailable_after: 25 Jun 2000 15:00:00 GMT') as any, { globals: {} })
    expect((r as any).type).toBe('error')
  })
})
