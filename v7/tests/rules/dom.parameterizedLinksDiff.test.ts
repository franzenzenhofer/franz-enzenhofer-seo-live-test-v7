import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { parameterizedLinksDiffRule as rule } from '@/rules/dom/parameterizedLinksDiff'
import { presentationSchema } from '@/shared/presentation/schema'

const facts = (phase: 'static' | 'idle', links: string[], truncated = false) => ({
  phase, parameterizedLinks: links, parameterizedLinkCount: links.length,
  parameterizedLinksTruncated: truncated, nodeCount: 1, maxDepth: 1,
  textLength: 0, scriptCount: 0, blockingScriptCount: 0,
  elements: [], elementsTruncated: false, documentAttributes: [],
})
const run = async (page: Record<string, unknown>) => enrichResult(await rule.run(page as never, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('rule: parameterized links diff', () => {
  it('warns when static and idle differ', async () => {
    const result = await run({ html: '', url: 'https://ex.com/page', staticFacts: facts('static', ['/a?x=1']), idleFacts: facts('idle', ['/b?y=1']) })
    expect(result.type).toBe('warn'); expect(result.priority).toBe(250)
    expect(value(result, 'Only in static DOM')).toBe(1); expect(value(result, 'Only in idle DOM')).toBe(1)
    expect(result.presentation?.input).toBe('Static DOM + Idle DOM')
    expect(result.presentation?.evidence.find((record) => record.name === 'Only in static 1')?.fields[0]).toEqual({ key: 'URL', value: 'https://ex.com/a?x=1', kind: 'url' })
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('bounds URL evidence to 10 per side and reports retained and omitted counts', async () => {
    const links = Array.from({ length: 12 }, (_, index) => `/a?x=${index}`)
    const result = await run({ url: 'https://ex.com/page', staticFacts: facts('static', links), idleFacts: facts('idle', []) })
    const detailValue = (key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value
    expect(value(result, 'Only in static DOM')).toBe(12)
    expect(detailValue('Only in static URLs retained')).toBe(10); expect(detailValue('Only in static URLs omitted')).toBe(2)
    expect(result.presentation?.evidence).toHaveLength(10)
  })

  it('reports ok when both phases match', async () => {
    const result = await run({ html: '', url: 'https://ex.com/page', staticFacts: facts('static', ['/a?x=1']), idleFacts: facts('idle', ['/a?x=1']) })
    expect(result.type).toBe('ok'); expect(result.priority).toBe(850)
    expect(value(result, 'Only in static DOM')).toBe(0); expect(value(result, 'Only in idle DOM')).toBe(0)
  })

  it('does not claim equality when exact evidence was truncated', async () => {
    const result = await run({ url: 'https://ex.com/page', staticFacts: facts('static', ['/a?x=1'], true), idleFacts: facts('idle', ['/a?x=1']) })
    expect(result.type).toBe('runtime_error'); expect(result.priority).toBe(900)
    expect(result.presentation?.input).toBe('Static DOM + Idle DOM')
  })

  it('reports which phase facts are missing', async () => {
    const result = await run({ url: 'https://ex.com/page', staticFacts: facts('static', []) })
    expect(result.type).toBe('runtime_error'); expect(result.priority).toBe(900)
    expect(result.presentation?.input).toBe('Static DOM')
    expect(value(result, 'Idle DOM facts')).toBe('Not captured')
  })

  it('reports an invalid page URL without claiming any DOM was read', async () => {
    const result = await run({ url: 'not a url', staticFacts: facts('static', []), idleFacts: facts('idle', []) })
    expect(result.type).toBe('runtime_error'); expect(result.priority).toBe(10)
    expect(result.presentation?.input).toBe('Page URL')
  })
})
