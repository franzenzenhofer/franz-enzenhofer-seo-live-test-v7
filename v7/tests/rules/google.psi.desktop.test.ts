import { describe, it, expect, vi, afterEach } from 'vitest'
import { psiDesktopRule } from '@/rules/google/psi/desktop'

const page = { html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html') }
const ctx = { globals: { variables: { google_page_speed_insights_key: 'super-secret-psi-key' } } }

const withScore = (score: number) => vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ lighthouseResult: { categories: { performance: { score } }, finalUrl: page.url } }),
})

describe('rule: psi desktop score', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('passes a good score', async () => {
    vi.stubGlobal('fetch', withScore(0.95))
    const r = await psiDesktopRule.run(page as any, ctx as any)
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(850)
    expect(r.presentation?.values).toEqual([{ key: 'Performance score', value: '95/100', kind: 'text' }])
    expect(r.presentation?.detailValues[0]?.key).toBe('PSI report')
    expect(r.presentation?.input).toBe('Page URL + PageSpeed Insights API response')
  })

  it('warns on a mid score', async () => {
    vi.stubGlobal('fetch', withScore(0.6))
    const r = await psiDesktopRule.run(page as any, ctx as any)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(300)
  })

  it('errors on a poor score', async () => {
    vi.stubGlobal('fetch', withScore(0.2))
    const r = await psiDesktopRule.run(page as any, ctx as any)
    expect(r.type).toBe('error')
    expect(r.priority).toBe(120)
  })

  it('reports info when the score is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ lighthouseResult: {} }) }))
    const r = await psiDesktopRule.run(page as any, ctx as any)
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.values).toEqual([{ key: 'Performance score', value: 'Not found', kind: 'text' }])
  })

  it('reports a runtime error when the API request fails, without leaking the API key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const r = await psiDesktopRule.run(page as any, ctx as any)
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    const copy = JSON.stringify(r.presentation)
    expect(copy).not.toContain('super-secret-psi-key')
    expect(r.presentation?.values).toEqual([
      { key: 'Request', value: 'Failed', kind: 'text' }, { key: 'Error', value: 'network down', kind: 'text' },
      { key: 'Requested URL', value: page.url, kind: 'url' },
    ])
  })

  it('never surfaces legacy details', async () => {
    vi.stubGlobal('fetch', withScore(0.95))
    const r = await psiDesktopRule.run(page as any, ctx as any)
    expect((r as any).details).toBeUndefined()
  })
})
