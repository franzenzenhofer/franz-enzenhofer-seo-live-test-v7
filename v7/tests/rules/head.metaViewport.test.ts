import { describe, it, expect } from 'vitest'
import { metaViewportRule } from '@/rules/head/metaViewport'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: meta viewport', () => {
  it('warns when missing', async () => {
    const r = await metaViewportRule.run({ html:'', url:'', doc: doc('<title>x</title>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('accepts typical viewport as ok', async () => {
    const r = await metaViewportRule.run({ html:'', url:'', doc: doc('<meta name="viewport" content="width=device-width, initial-scale=1">') }, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
  it('warns when width=device-width is missing', async () => {
    const r = await metaViewportRule.run({ html:'', url:'', doc: doc('<meta name="viewport" content="initial-scale=1">') }, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('width=device-width')
  })
  it('warns on initial-scale below 1', async () => {
    const r = await metaViewportRule.run({ html:'', url:'', doc: doc('<meta name="viewport" content="width=device-width, initial-scale=0.5">') }, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('initial-scale')
  })
  it('warns on user-scalable=no', async () => {
    const r = await metaViewportRule.run({ html:'', url:'', doc: doc('<meta name="viewport" content="width=device-width, user-scalable=no">') }, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('user-scalable')
  })
})
