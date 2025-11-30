import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/rules/google/google-gsc-utils', () => ({
  deriveGscProperty: vi.fn().mockResolvedValue({ property: 'https://example.com/', type: 'url-prefix' }),
  createGscPropertyDerivationFailedResult: vi.fn((url: string) => ({ label: 'GSC', message: `no property for ${url}`, type: 'runtime_error', name: 'mock' })),
}))

import { gscUrlInspectionRule } from '@/rules/google/gsc/urlInspection'

const page = { html: '', url: 'https://example.com', doc: new DOMParser().parseFromString('<p/>', 'text/html') }

describe('rule: gsc url inspection', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns ok when verdict PASS', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        inspectionResult: {
          inspectionResultLink: 'https://inspection.example.com',
          indexStatusResult: {
            verdict: 'PASS',
            coverageState: 'Indexed',
            referringUrls: ['https://ref.example.com'],
            lastCrawlTime: new Date().toISOString(),
          },
        },
      }),
    }))
    const r = await gscUrlInspectionRule.run(page as any, { globals: { googleApiAccessToken: 'token' } })
    expect(r.type).toBe('ok')
    expect(r.message).toContain('URL Inspection')
  })
})
