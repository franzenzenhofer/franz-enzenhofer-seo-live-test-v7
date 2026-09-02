import { describe, it, expect } from 'vitest'
import { titleLengthRule } from '@/rules/head/titleLength'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: title length', () => {
  it('reports short titles as info (no documented character thresholds)', async () => {
    const r = await titleLengthRule.run({ html:'', url:'', doc: doc('<title>x</title>') }, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).details.length).toBe(1)
  })
  it('reports good titles as info', async () => {
    const r = await titleLengthRule.run({ html:'', url:'', doc: doc('<title>This is a good title with more than fifty characters total</title>') }, { globals: {} })
    expect((r as any).type).toBe('info')
  })
  it('reports very long titles as info with the measured length', async () => {
    const long = 'word '.repeat(60).trim()
    const r = await titleLengthRule.run({ html:'', url:'', doc: doc(`<title>${long}</title>`) }, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).message).toContain(`${long.length}`)
  })
  it('defers missing title to head-title with an info result', async () => {
    const r = await titleLengthRule.run({ html:'', url:'', doc: doc('<p>no title</p>') }, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).message).toContain('SEO Title Present')
  })
  it('defers blank title to head-title with an info result', async () => {
    const r = await titleLengthRule.run({ html:'', url:'', doc: doc('<title>   </title>') }, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).details.length).toBe(0)
  })
})
