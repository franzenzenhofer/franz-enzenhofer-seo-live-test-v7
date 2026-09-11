import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/rules/google/google-gsc-utils', () => ({
  deriveGscProperty: vi.fn().mockResolvedValue({ property: 'https://example.com/', type: 'url-prefix' }),
}))

import { deriveGscProperty } from '@/rules/google/google-gsc-utils'
import { gscUrlInspectionRule } from '@/rules/google/gsc/urlInspection'

const page = { html: '', url: 'https://example.com', doc: new DOMParser().parseFromString('<p/>', 'text/html') }

const stub = (status: number, json: unknown) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => json }))

describe('rule: gsc url inspection', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports not signed in when no token is stored', async () => {
    const r = await gscUrlInspectionRule.run(page as any, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.presentation?.input).toBe('Extension session state')
  })

  it('returns ok when verdict PASS', async () => {
    stub(200, {
      inspectionResult: {
        inspectionResultLink: 'https://inspection.example.com',
        indexStatusResult: {
          verdict: 'PASS',
          coverageState: 'Indexed',
          referringUrls: ['https://ref.example.com'],
          lastCrawlTime: '2026-01-01T00:00:00.000Z',
        },
      },
    })
    const r = await gscUrlInspectionRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(700)
    const values = Object.fromEntries(r.presentation!.values.map((f) => [f.key, f.value]))
    expect(values['Coverage state']).toBe('Indexed')
    expect(values['Verdict']).toContain('PASS')
    expect(values['Last crawl']).toBe('2026-01-01T00:00:00.000Z')
    expect(r.presentation?.evidence.find((e) => e.name === 'Referring URLs')).toBeTruthy()
  })

  it('warns on verdict FAIL', async () => {
    stub(200, { inspectionResult: { indexStatusResult: { verdict: 'FAIL', coverageState: 'Not indexed' } } })
    const r = await gscUrlInspectionRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(120)
  })

  it('reports info on a neutral verdict', async () => {
    stub(200, { inspectionResult: { indexStatusResult: { verdict: 'NEUTRAL', coverageState: 'Excluded' } } })
    const r = await gscUrlInspectionRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(120)
  })

  it('reports a runtime error naming the HTTP status on API failure', async () => {
    stub(403, {})
    const r = await gscUrlInspectionRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.values[0]?.value).toContain('403')
  })

  it('reports a bounded runtime error on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timed out')))
    const r = await gscUrlInspectionRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.presentation?.input).toBe('Page URL')
  })

  it('reports a malformed-response runtime error with priority 0', async () => {
    stub(200, { inspectionResult: 'not-an-object' })
    const r = await gscUrlInspectionRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(0)
  })

  it('reports a no-results runtime error with priority -500', async () => {
    stub(200, { inspectionResult: {} })
    const r = await gscUrlInspectionRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-500)
  })

  it('reports a runtime error when no property can be confirmed', async () => {
    vi.mocked(deriveGscProperty).mockResolvedValueOnce(null)
    const r = await gscUrlInspectionRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('runtime_error'); expect(r.priority).toBe(-1000)
    expect(r.presentation?.values).toEqual([{ key: 'Search Console property', value: 'Not confirmed for the signed-in account', kind: 'text' }])
  })

  it('never surfaces legacy details', async () => {
    stub(200, { inspectionResult: { indexStatusResult: { verdict: 'PASS', coverageState: 'Indexed' } } })
    const r = await gscUrlInspectionRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect((r as any).details).toBeUndefined()
  })
})
