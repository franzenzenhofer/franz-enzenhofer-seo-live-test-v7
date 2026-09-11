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

const values = (r: any): Record<string, string> => Object.fromEntries(r.presentation.values.map((f: any) => [f.key, f.value]))

describe('rule: psi mobile FCP/TBT', () => {
  it('grades good FCP and TBT as ok', async () => {
    const r = await runWith(1234, 56)
    const v = values(r)
    expect(v['First Contentful Paint (FCP)']).toBe('1234 ms')
    expect(v['Total Blocking Time (TBT)']).toBe('56 ms')
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(850)
  })

  it('warns when FCP needs improvement (1800-3000ms)', async () => {
    const r = await runWith(2200, 56)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(300)
  })

  it('errors on poor FCP (> 3000ms)', async () => {
    const r = await runWith(3400, 56)
    expect(r.type).toBe('error')
    expect(r.priority).toBe(120)
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
    expect(values(r)['Mobile FCP/TBT']).toBe('Not reported by PageSpeed Insights')
  })

  it('reports a runtime error when the API request fails, without leaking the API key', async () => {
    const orig = globalThis.fetch
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down')) as any
    const p = { html:'', url:'https://ex.com', doc: new DOMParser().parseFromString('<p/>','text/html') }
    const r = await psiMobileFcpTbtRule.run(p as any, { globals: { variables: { google_page_speed_insights_key: 'super-secret-psi-key' } } } as any)
    globalThis.fetch = orig
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    const copy = JSON.stringify(r.presentation)
    expect(copy).not.toContain('super-secret-psi-key')
    expect(copy).toContain('network down')
  })

  it('never surfaces legacy details', async () => {
    const r = await runWith(1234, 56)
    expect(r.details).toBeUndefined()
  })
})
