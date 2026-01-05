import { describe, it, expect } from 'vitest'
import { dataNosnippetRule } from '@/rules/dom/dataNosnippet'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('dom: data-nosnippet', () => {
  it('warns when data-nosnippet is present', async () => {
    const html = '<body><p data-nosnippet>Hidden text</p></body>'
    const r = await dataNosnippetRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('reports info when data-nosnippet is absent', async () => {
    const html = '<body><p>Visible text</p></body>'
    const r = await dataNosnippetRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
