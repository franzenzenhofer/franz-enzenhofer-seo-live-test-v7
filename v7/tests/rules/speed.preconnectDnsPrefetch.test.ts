import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { preconnectRule } from '@/rules/speed/preconnect'
import { dnsPrefetchRule } from '@/rules/speed/dnsPrefetch'
import { presentationSchema } from '@/shared/presentation/schema'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const runPreconnect = async (doc: Document) => enrichResult(await preconnectRule.run({ html: '', url: 'https://ex.com', doc } as never, { globals: {} }), preconnectRule, 'test')
const value = (result: Awaited<ReturnType<typeof runPreconnect>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('rule: speed preconnect', () => {
  it('counts preconnect links and resolves their href', async () => {
    const result = await runPreconnect(D('<head><link rel="preconnect" href="https://a.com"></head>'))
    expect(result.type).toBe('info'); expect(result.priority).toBe(750); expect(value(result, 'Preconnect links')).toBe(1)
    expect(result.presentation?.input).toBe('Static DOM')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Href')).toEqual({ key: 'Href', value: 'https://a.com', kind: 'url' })
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('reports no preconnect links as informational', async () => {
    const result = await runPreconnect(D('<head></head>'))
    expect(result.priority).toBe(900); expect(value(result, 'Preconnect links')).toBe(0)
  })
})

describe('rule: speed dns-prefetch (not yet migrated)', () => {
  it('counts links', async () => {
    const doc = D('<head><link rel="dns-prefetch" href="//b.com"></head>')
    const p = { html: '', url: '', doc }
    const r2 = await dnsPrefetchRule.run(p as any, { globals: {} })
    expect((r2 as any).message.includes('dns-prefetch')).toBe(true)
  })
})
