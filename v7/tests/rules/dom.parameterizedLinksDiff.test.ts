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
    expect(result.presentation?.values).toEqual([
      { key: 'Links compared', value: '1 static, 1 idle', kind: 'text' },
      { key: 'Only in static DOM', value: 1, kind: 'text' }, { key: 'Only in idle DOM', value: 1, kind: 'text' },
      { key: 'Only in static', value: 'https://ex.com/a?x=1', kind: 'url' }, { key: 'Only in idle', value: 'https://ex.com/b?y=1', kind: 'url' },
    ])
    expect(result.presentation?.input).toBe('Static DOM + Idle DOM')
    expect(result.presentation?.evidence.find((record) => record.name === 'Only in static 1')?.fields[0]).toEqual({ key: 'URL', value: 'https://ex.com/a?x=1', kind: 'url' })
    expect(result.presentation?.detailValues).toEqual([
      { key: 'Markup retained', value: 0, kind: 'text' }, { key: 'Markup omitted', value: 2, kind: 'text' },
      { key: 'Evidence retained', value: 2, kind: 'text' }, { key: 'Evidence omitted', value: 0, kind: 'text' },
    ])
    expect(result.presentation?.noMarkup).toMatch(/^Not retained:/)
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('bounds URL evidence to 10 per side and reports retained and omitted counts', async () => {
    const links = Array.from({ length: 12 }, (_, index) => `/a?x=${index}`)
    const result = await run({ url: 'https://ex.com/page', staticFacts: facts('static', links), idleFacts: facts('idle', []) })
    const detailValue = (key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value
    expect(value(result, 'Only in static DOM')).toBe(12)
    expect(detailValue('Evidence retained')).toBe(10); expect(detailValue('Evidence omitted')).toBe(2)
    expect(result.presentation?.evidence).toHaveLength(10)
    // More than three differences: the overview shows the first URL of each side, the rest is evidence.
    expect(result.presentation?.values.filter((field) => field.kind === 'url')).toEqual([{ key: 'Only in static', value: 'https://ex.com/a?x=0', kind: 'url' }])
  })

  it('reports ok when both phases match', async () => {
    const result = await run({ html: '', url: 'https://ex.com/page', staticFacts: facts('static', ['/a?x=1']), idleFacts: facts('idle', ['/a?x=1']) })
    expect(result.type).toBe('ok'); expect(result.priority).toBe(850)
    expect(value(result, 'Only in static DOM')).toBe(0); expect(value(result, 'Only in idle DOM')).toBe(0)
    expect(result.presentation?.evidence).toEqual([]); expect(result.presentation?.detailValues).toEqual([])
  })

  it('does not claim equality when exact evidence was truncated', async () => {
    const result = await run({ url: 'https://ex.com/page', staticFacts: facts('static', ['/a?x=1'], true), idleFacts: facts('idle', ['/a?x=1']) })
    expect(result.type).toBe('runtime_error'); expect(result.priority).toBe(900)
    expect(result.presentation?.input).toBe('Static DOM + Idle DOM')
    expect(value(result, 'Links recorded')).toBe('1 static, 1 idle'); expect(value(result, 'Link evidence')).toBe('Truncated')
  })

  it('reports which phase facts are missing', async () => {
    const result = await run({ url: 'https://ex.com/page', staticFacts: facts('static', []) })
    expect(result.type).toBe('runtime_error'); expect(result.priority).toBe(900)
    expect(result.presentation?.input).toBe('Not captured')
    expect(result.presentation?.values).toEqual([{ key: 'Idle DOM facts', value: 'Not captured', kind: 'text' }])
  })

  it('reports an invalid page URL without claiming any DOM was read', async () => {
    const result = await run({ url: 'not a url', staticFacts: facts('static', []), idleFacts: facts('idle', []) })
    expect(result.type).toBe('runtime_error'); expect(result.priority).toBe(10)
    expect(result.presentation?.input).toBe('Page URL')
    expect(value(result, 'Current page URL')).toBe('Invalid')
  })
})
