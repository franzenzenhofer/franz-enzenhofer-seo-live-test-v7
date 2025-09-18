import { describe, it, expect } from 'vitest'
import { nodeCountRule } from '@/rules/dom/nodeCount'
import { nodeDepthRule } from '@/rules/dom/nodeDepth'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: dom nodes', () => {
  it('counts and measures depth', async () => {
    const doc = D('<div><span><b>x</b></span></div>')
    const p = { html:'', url:'https://ex.com', doc }
    const c = await nodeCountRule.run(p as any, { globals: {} })
    const d = await nodeDepthRule.run(p as any, { globals: {} })
    expect((c as any).message.includes('Node count')).toBe(true)
    expect((d as any).message.includes('Max depth')).toBe(true)
  })
})

