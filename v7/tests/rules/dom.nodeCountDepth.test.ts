import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { nodeCountRule } from '@/rules/dom/nodeCount'
import { nodeDepthRule } from '@/rules/dom/nodeDepth'
import { presentationSchema } from '@/shared/presentation/schema'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const runCount = async (html: string, idleFacts?: { nodeCount?: number }) =>
  enrichResult(await nodeCountRule.run({ html, url: 'https://ex.com', doc: D(html), idleFacts } as never, { globals: {} }), nodeCountRule, 'test')
const runDepth = async (html: string, idleFacts?: { maxDepth?: number }) =>
  enrichResult(await nodeDepthRule.run({ html, url: 'https://ex.com', doc: D(html), idleFacts } as never, { globals: {} }), nodeDepthRule, 'test')
const value = (result: Awaited<ReturnType<typeof runCount>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('rule: DOM node count', () => {
  it('reports the fallback parsed document count as an informational observation', async () => {
    const result = await runCount('<div><span><b>x</b></span></div>')
    expect(result.type).toBe('info'); expect(result.priority).toBe(800)
    expect(typeof value(result, 'DOM nodes')).toBe('number')
    expect(result.presentation?.detailValues).toContainEqual({ key: 'Count source', value: 'Parsed document tree', kind: 'text' })
    expect(result.presentation?.markup).toEqual([])
    expect(result.presentation?.input).toBe('Idle DOM')
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('uses the idle facts count when one is present', async () => {
    const result = await runCount('<div>Different</div>', { nodeCount: 42 })
    expect(value(result, 'DOM nodes')).toBe(42)
    expect(result.presentation?.detailValues).toContainEqual({ key: 'Count source', value: 'Idle DOM facts', kind: 'text' })
  })
})

describe('rule: DOM node depth', () => {
  it('reports fallback parsed tree depth including text nodes', async () => {
    const result = await runDepth('<div><span>Text</span></div>')
    expect(result.type).toBe('info'); expect(result.priority).toBe(800)
    expect(typeof value(result, 'Maximum node depth')).toBe('number')
    expect(result.presentation?.markup).toEqual([])
    expect(result.presentation?.input).toBe('Idle DOM')
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('uses the idle facts depth when one is present', async () => {
    const result = await runDepth('<div>Different</div>', { maxDepth: 19 })
    expect(value(result, 'Maximum node depth')).toBe(19)
    expect(result.presentation?.detailValues).toContainEqual({ key: 'Depth source', value: 'Idle DOM facts', kind: 'text' })
  })
})
