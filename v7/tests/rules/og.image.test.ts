import { describe, it, expect } from 'vitest'
import { ogImageRule } from '@/rules/og/image'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('rule: og image', () => {
  it('warns relative', async () => {
    const r = await ogImageRule.run({ html:'', url:'https://ex.com', doc: D('<meta property="og:image" content="/a.jpg">') } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})

