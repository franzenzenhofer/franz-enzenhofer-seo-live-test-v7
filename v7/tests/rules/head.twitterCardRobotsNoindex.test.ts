import { describe, it, expect } from 'vitest'
import { robotsNoindexRule } from '@/rules/head/robotsNoindex'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rules: twitter card + noindex', () => {
  it('warns noindex', async () => {
    const r = await robotsNoindexRule.run({ html: '', url: '', doc: D('<meta name="robots" content="noindex,nofollow">') } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})
