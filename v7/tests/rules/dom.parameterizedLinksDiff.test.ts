import { describe, expect, it } from 'vitest'

import { parameterizedLinksDiffRule } from '@/rules/dom/parameterizedLinksDiff'

const facts = (phase: 'static' | 'idle', links: string[], truncated = false) => ({
  phase, parameterizedLinks: links, parameterizedLinkCount: links.length,
  parameterizedLinksTruncated: truncated, nodeCount: 1, maxDepth: 1,
  textLength: 0, scriptCount: 0, blockingScriptCount: 0,
  elements: [], elementsTruncated: false, documentAttributes: [],
})

describe('rule: parameterized links diff', () => {
  it('warns when static and idle differ', async () => {
    const p = {
      html: '',
      url: 'https://ex.com/page',
      staticFacts: facts('static', ['/a?x=1']),
      idleFacts: facts('idle', ['/b?y=1']),
    }
    const r = await parameterizedLinksDiffRule.run(p as any, { globals: {} })
    expect(r.type).toBe('warn')
  })

  it('does not claim equality when exact evidence was truncated', async () => {
    const page = {
      url: 'https://ex.com/page',
      staticFacts: facts('static', ['/a?x=1'], true),
      idleFacts: facts('idle', ['/a?x=1']),
    }
    const result = await parameterizedLinksDiffRule.run(page as any, { globals: {} })
    expect(result.type).toBe('runtime_error')
    expect(result.message).toContain('unavailable')
  })
})
