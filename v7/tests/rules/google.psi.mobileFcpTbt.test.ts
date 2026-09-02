import { describe, it, expect, vi } from 'vitest'
import { psiMobileFcpTbtRule } from '@/rules/google/psi/mobileFcpTbt'

const runWith = async (fcp: number | undefined, tbt: number | undefined) => {
  const orig = globalThis.fetch
  const audits: Record<string, { numericValue: number }> = {}
  if (typeof fcp === 'number') audits['first-contentful-paint'] = { numericValue: fcp }
  if (typeof tbt === 'number') audits['total-blocking-time'] = { numericValue: tbt }
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ lighthouseResult: { audits } }) }) as any
  const p = { html:'', url:'https://ex.com', doc: new DOMParser().parseFromString('<p/>','text/html') }
  const r = await psiMobileFcpTbtRule.run(p as any, { globals: { variables: { google_page_speed_insights_key: 'k' } } } as any)
  globalThis.fetch = orig
  return r as any
}

describe('rule: psi mobile FCP/TBT', () => {
  it('grades good FCP and TBT as ok', async () => {
    const r = await runWith(1234, 56)
    expect(r.message.includes('FCP')).toBe(true)
    expect(r.message.includes('TBT')).toBe(true)
    expect(r.type).toBe('ok')
  })

  it('warns when FCP needs improvement (1800-3000ms)', async () => {
    const r = await runWith(2200, 56)
    expect(r.type).toBe('warn')
  })

  it('errors on poor FCP (> 3000ms)', async () => {
    const r = await runWith(3400, 56)
    expect(r.type).toBe('error')
  })

  it('warns when TBT is 200ms or more', async () => {
    const r = await runWith(1200, 350)
    expect(r.type).toBe('warn')
  })

  it('errors when TBT exceeds 600ms', async () => {
    const r = await runWith(1200, 800)
    expect(r.type).toBe('error')
  })

  it('returns info when metrics are unavailable', async () => {
    const r = await runWith(undefined, undefined)
    expect(r.type).toBe('info')
    expect(r.message.includes('unavailable')).toBe(true)
  })
})
