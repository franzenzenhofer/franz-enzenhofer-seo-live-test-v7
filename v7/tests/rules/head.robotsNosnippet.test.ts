import { describe, it, expect } from 'vitest'
import { robotsNosnippetRule } from '@/rules/head/robotsNosnippet'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('head: robots nosnippet', () => {
  it('warns when nosnippet is present', async () => {
    const html = '<head><meta name="robots" content="nosnippet"></head>'
    const r = await robotsNosnippetRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('warns when max-snippet:0 is present', async () => {
    const html = '<head><meta name="robots" content="max-snippet:0"></head>'
    const r = await robotsNosnippetRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('reports info when directive is absent', async () => {
    const html = '<head><meta name="robots" content="index,follow"></head>'
    const r = await robotsNosnippetRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
