import { describe, it, expect } from 'vitest'
import { ogUrlRule } from '@/rules/og/url'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: og url', () => {
  it('warns missing', async () => {
    const r = await ogUrlRule.run({ html:'', url:'', doc: doc('<p/>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('info present', async () => {
    const r = await ogUrlRule.run({ html:'', url:'', doc: doc('<meta property="og:url" content="https://ex.com">') }, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

