import { describe, it, expect } from 'vitest'
import { twitterCardRule } from '@/rules/head/twitterCard'
import { robotsNoindexRule } from '@/rules/head/robotsNoindex'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('rules: twitter card + noindex', () => {
  it('reports twitter card', async () => {
    const r = await twitterCardRule.run({ html:'', url:'', doc: D('<meta name="twitter:card" content="summary_large_image">') } as any, { globals: {} })
    expect((r as any).message.includes('twitter:card')).toBe(true)
  })
  it('warns noindex', async () => {
    const r = await robotsNoindexRule.run({ html:'', url:'', doc: D('<meta name="robots" content="noindex,nofollow">') } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})

