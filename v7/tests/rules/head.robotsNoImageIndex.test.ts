import { describe, it, expect } from 'vitest'
import { robotsNoImageIndexRule } from '@/rules/head/robotsNoImageIndex'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('head: robots noimageindex', () => {
  it('warns when noimageindex is present', async () => {
    const html = '<head><meta name="robots" content="noimageindex"></head>'
    const r = await robotsNoImageIndexRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('reports info when directive is absent', async () => {
    const html = '<head><meta name="robots" content="index,follow"></head>'
    const r = await robotsNoImageIndexRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
