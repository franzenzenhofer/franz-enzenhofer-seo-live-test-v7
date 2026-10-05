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
    expect(result.presentation?.values).toEqual([
      { key: 'Characters added', value: 180, kind: 'text' }, { key: 'Characters removed', value: 0, kind: 'text' },
      { key: 'Fingerprint', value: 'Not checked', kind: 'text' }, { key: 'Rendering signals', value: 'Found', kind: 'text' },
    ])
    expect(detail(result, 'Hydration criterion')).toBe('Met'); expect(detail(result, 'Script-heavy criterion')).toBe('Met')
    expect(detail(result, 'Static characters')).toBe(20); expect(detail(result, 'Idle characters')).toBe(200)
    expect(detail(result, 'Static scripts')).toBe(6); expect(result.presentation?.evidence).toEqual([])
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
    expect(value(result, 'Rendering signals')).toBe('Not found'); expect(detail(result, 'Hydration criterion')).toBe('Unmet')
  })

  it('meets the heuristic through the script-heavy criterion without any text difference', async () => {
    const result = await run({ staticFacts: facts('static', 20, 6), idleFacts: facts('idle', 20, 6) })
    expect(result.type).toBe('info'); expect(result.priority).toBe(500)
    expect(value(result, 'Rendering signals')).toBe('Found')
    expect(value(result, 'Characters added')).toBe(0); expect(value(result, 'Characters removed')).toBe(0)
  })

  it('fails explicitly when a lifecycle phase is missing', async () => {
    const result = await run({ staticFacts: facts('static', 20) })
    expect(result.type).toBe('runtime_error'); expect(result.priority).toBe(900)
    // The comparison had no complete input: declared once as the checked input, one row names the missing phase.
    expect(result.presentation?.input).toBe('Not captured')
    expect(result.presentation?.values).toEqual([{ key: 'Idle DOM facts', value: 'Not captured', kind: 'text' }])
  })
})
