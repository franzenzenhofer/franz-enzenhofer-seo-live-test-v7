import { describe, it, expect } from 'vitest'
import { h1Rule } from '@/rules/body/h1'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: body h1', () => {
  it('warns none', async () => {
    const r = await h1Rule.run({ html:'', url:'', doc: doc('<p/>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('ok one', async () => {
    const r = await h1Rule.run({ html:'', url:'', doc: doc('<h1>Hi</h1>') }, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

