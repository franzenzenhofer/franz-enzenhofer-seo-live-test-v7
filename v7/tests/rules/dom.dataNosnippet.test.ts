import { describe, it, expect } from 'vitest'
import { dataNosnippetRule } from '@/rules/dom/dataNosnippet'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('dom: data-nosnippet', () => {
  it('reports info when data-nosnippet is on supported elements', async () => {
    const html = '<body><span data-nosnippet>Hidden</span><div data-nosnippet>Hidden too</div><section data-nosnippet>Also</section></body>'
    const r = await dataNosnippetRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).message).toContain('3 element(s)')
  })

  it('warns when data-nosnippet is on unsupported elements', async () => {
    const html = '<body><p data-nosnippet>Hidden text</p><span data-nosnippet>Fine</span></body>'
    const r = await dataNosnippetRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('unsupported')
    expect((r as any).details?.unsupportedTags).toEqual(['p'])
  })

  it('reports info when data-nosnippet is absent', async () => {
    const html = '<body><p>Visible text</p></body>'
    const r = await dataNosnippetRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
