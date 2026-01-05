import { describe, it, expect } from 'vitest'
import { robotsMaxVideoPreviewRule } from '@/rules/head/robotsMaxVideoPreview'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('head: robots max-video-preview', () => {
  it('reports info when directive is missing', async () => {
    const html = '<head></head>'
    const r = await robotsMaxVideoPreviewRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('reports info for valid numeric values', async () => {
    const html = '<head><meta name="robots" content="max-video-preview:30"></head>'
    const r = await robotsMaxVideoPreviewRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('warns on invalid values', async () => {
    const html = '<head><meta name="robots" content="max-video-preview:abc"></head>'
    const r = await robotsMaxVideoPreviewRule.run({ html:'', url:'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})
