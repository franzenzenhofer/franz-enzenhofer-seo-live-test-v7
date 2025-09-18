import { describe, it, expect } from 'vitest'
import { metaViewportRule } from '@/rules/head/metaViewport'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: meta viewport', () => {
  it('flags missing', async () => {
    const r = await metaViewportRule.run({ html:'', url:'', doc: doc('<title>x</title>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('accepts typical viewport', async () => {
    const r = await metaViewportRule.run({ html:'', url:'', doc: doc('<meta name="viewport" content="width=device-width, initial-scale=1">') }, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

