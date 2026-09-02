import { describe, it, expect } from 'vitest'
import { ogTitleRule } from '@/rules/og/title'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: og title', () => {
  it('warns missing (required OGP property)', async () => {
    const r = await ogTitleRule.run({ html:'', url:'https://ex.com', doc: D('<title>x</title>') } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('info when present via property attribute', async () => {
    const r = await ogTitleRule.run({ html:'', url:'https://ex.com', doc: D('<meta property="og:title" content="T">') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).details.ogTitle).toBe('T')
  })

  it('finds the common name attribute fallback', async () => {
    const r = await ogTitleRule.run({ html:'', url:'https://ex.com', doc: D('<meta name="og:title" content="T">') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
