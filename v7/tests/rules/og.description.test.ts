import { describe, it, expect } from 'vitest'
import { ogDescriptionRule } from '@/rules/og/description'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: og description', () => {
  it('flags missing', async () => {
    const r = await ogDescriptionRule.run({ html:'', url:'', doc: doc('<title>x</title>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('accepts present', async () => {
    const r = await ogDescriptionRule.run({ html:'', url:'', doc: doc('<meta property="og:description" content="D">') }, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

