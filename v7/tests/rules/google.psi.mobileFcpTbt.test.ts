import { describe, it, expect, vi } from 'vitest'
import { psiMobileFcpTbtRule } from '@/rules/google/psi/mobileFcpTbt'

describe('rule: psi mobile FCP/TBT', () => {
  it('formats metrics', async () => {
    const orig = globalThis.fetch
    // @ts-expect-error mock
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ lighthouseResult: { audits: { 'first-contentful-paint': { numericValue: 1234 }, 'total-blocking-time': { numericValue: 56 } } } }) })
    const p = { html:'', url:'https://ex.com', doc: new DOMParser().parseFromString('<p/>','text/html') }
    const r = await psiMobileFcpTbtRule.run(p as any, { globals: { variables: { google_page_speed_insights_key: 'k' } } } as any)
    expect((r as any).message.includes('FCP')).toBe(true)
    globalThis.fetch = orig
  })
})

