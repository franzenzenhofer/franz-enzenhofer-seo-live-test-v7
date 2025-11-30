import { describe, it, expect } from 'vitest'
import { metaUnavailableAfterRule } from '@/rules/head/metaUnavailableAfter'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: meta unavailable_after', () => {
  it('reports absence as info', async () => {
    const r = await metaUnavailableAfterRule.run({ html:'', url:'https://example.com', doc: doc('<head></head>') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('warns when present in future', async () => {
    const html = '<meta content="unavailable_after: 25 Jun 2050 15:00:00 GMT">'
    const r = await metaUnavailableAfterRule.run({ html, url:'https://example.com', doc: doc(html) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('errors when date is in the past', async () => {
    const html = '<meta content="unavailable_after: 25 Jun 2000 15:00:00 GMT">'
    const r = await metaUnavailableAfterRule.run({ html, url:'https://example.com', doc: doc(html) } as any, { globals: {} })
    expect((r as any).type).toBe('error')
  })
})
