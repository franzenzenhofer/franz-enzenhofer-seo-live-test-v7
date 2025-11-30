import { describe, it, expect } from 'vitest'
import { canonicalAbsoluteRule } from '@/rules/head/canonicalAbsolute'
import { canonicalSelfRule } from '@/rules/head/canonicalSelf'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('rules: canonical', () => {
  it('absolute', async () => {
    const r = await canonicalAbsoluteRule.run({ html:'', url:'https://ex.com/a', doc: D('<link rel="canonical" href="https://ex.com/a">') } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
  it('self match', async () => {
    const r = await canonicalSelfRule.run({ html:'', url:'https://ex.com/a', doc: D('<link rel="canonical" href="https://ex.com/a">') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
