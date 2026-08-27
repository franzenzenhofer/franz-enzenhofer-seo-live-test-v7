import { describe, it, expect } from 'vitest'
import { clientSideRenderingRule } from '@/rules/dom/clientSideRendering'

const facts = (phase: 'static' | 'idle', textLength: number, scriptCount = 0) => ({
  phase, textLength, scriptCount, blockingScriptCount: 0,
  nodeCount: 1, maxDepth: 1, parameterizedLinkCount: 0,
  parameterizedLinks: [], parameterizedLinksTruncated: false,
  elements: [], elementsTruncated: false, documentAttributes: [],
})

describe('rule: client-side rendering heuristic', () => {
  it('reports material hydration from distinct phase facts', async () => {
    const page = { staticFacts: facts('static', 20, 6), idleFacts: facts('idle', 200, 6) }
    const result = await clientSideRenderingRule.run(page as any, { globals: {} })

    expect(result.message).toContain('changed visible text by 180')
    expect(result.details?.['hydrated']).toBe(true)
  })

  it('fails explicitly when a lifecycle phase is missing', async () => {
    const result = await clientSideRenderingRule.run({ staticFacts: facts('static', 20) } as any, { globals: {} })
    expect(result.type).toBe('runtime_error')
  })
})
