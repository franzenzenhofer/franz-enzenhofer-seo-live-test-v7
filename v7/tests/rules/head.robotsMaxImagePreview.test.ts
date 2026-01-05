import { describe, expect, it } from 'vitest'

import { robotsMaxImagePreviewRule } from '@/rules/head/robotsMaxImagePreview'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('head: robots max-image-preview', () => {
  it('reports info when directive is missing', async () => {
    const r = await robotsMaxImagePreviewRule.run({ html: '', url: 'https://ex.com', doc: D('<head></head>') } as any, { globals: {} })
    expect(r.type).toBe('info')
  })

  it('reports info for valid values', async () => {
    const html = '<head><meta name="robots" content="max-image-preview:standard"></head>'
    const r = await robotsMaxImagePreviewRule.run({ html: '', url: 'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect(r.type).toBe('info')
  })

  it('warns on invalid values', async () => {
    const html = '<head><meta name="robots" content="max-image-preview:giant"></head>'
    const r = await robotsMaxImagePreviewRule.run({ html: '', url: 'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect(r.type).toBe('warn')
  })
})
