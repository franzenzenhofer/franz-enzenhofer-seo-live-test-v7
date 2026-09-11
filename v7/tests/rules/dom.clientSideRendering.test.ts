import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { clientSideRenderingRule as rule } from '@/rules/dom/clientSideRendering'
import { presentationSchema } from '@/shared/presentation/schema'

const facts = (phase: 'static' | 'idle', textLength: number, scriptCount = 0) => ({
  phase, textLength, scriptCount, blockingScriptCount: 0,
  nodeCount: 1, maxDepth: 1, parameterizedLinkCount: 0,
  parameterizedLinks: [], parameterizedLinksTruncated: false,
  elements: [], elementsTruncated: false, documentAttributes: [],
})
const run = async (page: Record<string, unknown>) => enrichResult(await rule.run({ url: 'https://ex.test/', ...page } as never, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('rule: client-side rendering heuristic', () => {
  it('reports material hydration from distinct phase facts', async () => {
    const result = await run({ staticFacts: facts('static', 20, 6), idleFacts: facts('idle', 200, 6) })
    expect(result.type).toBe('info'); expect(result.priority).toBe(500)
    expect(value(result, 'Client-side rendering heuristic')).toBe('Met')
    expect(value(result, 'Text added (characters)')).toBe(180); expect(value(result, 'Text removed (characters)')).toBe(0)
    expect(detail(result, 'Hydration heuristic met')).toBe('Yes')
    expect(result.presentation?.input).toBe('Static DOM + Idle DOM')
    expect(result.details).toBeUndefined()
    // The rule compares two JavaScript-enabled lifecycle observations - it never
    // claims a source-HTML or JavaScript-disabled comparison.
    const checkedText = result.presentation?.checked.map((field) => field.value).join(' ') || ''
    expect(checkedText).toContain('not a source-HTML or JavaScript-disabled comparison')
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('reports no material difference when phases match', async () => {
    const result = await run({ staticFacts: facts('static', 200), idleFacts: facts('idle', 200) })
    expect(result.type).toBe('info'); expect(result.priority).toBe(850)
    expect(value(result, 'Client-side rendering heuristic')).toBe('Not met')
  })

  it('meets the heuristic through the script-heavy criterion without any text difference', async () => {
    const result = await run({ staticFacts: facts('static', 20, 6), idleFacts: facts('idle', 20, 6) })
    expect(result.type).toBe('info'); expect(result.priority).toBe(500)
    expect(value(result, 'Client-side rendering heuristic')).toBe('Met')
    expect(value(result, 'Text added (characters)')).toBe(0); expect(value(result, 'Text removed (characters)')).toBe(0)
  })

  it('fails explicitly when a lifecycle phase is missing', async () => {
    const result = await run({ staticFacts: facts('static', 20) })
    expect(result.type).toBe('runtime_error'); expect(result.priority).toBe(900)
    expect(result.presentation?.input).toBe('Static DOM')
    expect(value(result, 'Idle DOM facts')).toBe('Not captured')
  })
})
