import { describe, it, expect } from 'vitest'
import { robotsMaxSnippetRule } from '@/rules/head/robotsMaxSnippet'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('head: robots max-snippet', () => {
  it('reports info when directive is missing', async () => {
    const html = '<head></head>'
    const r = await robotsMaxSnippetRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('reports info for valid numeric values', async () => {
    const html = '<head><meta name="robots" content="max-snippet:50"></head>'
    const r = await robotsMaxSnippetRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('warns on invalid values', async () => {
    const html = '<head><meta name="robots" content="max-snippet:foo"></head>'
    const r = await robotsMaxSnippetRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})
