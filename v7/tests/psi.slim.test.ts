import { describe, it, expect, vi, beforeEach } from 'vitest'

import fixture from './fixtures/psi-mobile-full.json'

import { summarizePSI } from '@/rules/google/psi/summary'
import { runPSI } from '@/shared/psi'
import { slimPSI, type PSIResult } from '@/shared/psiSlim'

const bytes = (v: unknown) => JSON.stringify(v).length
const URL_UNDER_TEST = 'https://www.octenisept.at/'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => fixture }) as unknown as Response))
})

describe('runPSI returns a slim projection, not the full Lighthouse payload', () => {
  it('returns a result without screenshots that is far below 5 KB', async () => {
    const returned = await runPSI(URL_UNDER_TEST, 'mobile', 'K')

    const before = bytes(fixture)
    const after = bytes(returned)
    console.log(`[psi.slim] returned bytes: before=${before} after=${after} ratio=${(before / after).toFixed(0)}x`)

    expect(before).toBeGreaterThan(50_000)
    expect(after).toBeLessThan(5_000)
    expect(JSON.stringify(returned)).not.toMatch(/base64|screenshot|thumbnails|network-requests/)
    expect(returned.lighthouseResult).not.toHaveProperty('fullPageScreenshot')
    expect(Object.keys(returned.lighthouseResult?.audits ?? {}).sort()).toEqual([
      'cumulative-layout-shift',
      'first-contentful-paint',
      'largest-contentful-paint',
      'speed-index',
      'total-blocking-time',
    ])
    // One value: what the rules get back is exactly what slimPSI produces from the fixture.
    expect(returned).toEqual(slimPSI(fixture))
  })
})

describe('slimPSI keeps everything summarizePSI reads', () => {
  it('produces an identical summary from the full and the slim response', () => {
    const full = fixture as unknown as PSIResult
    const slim = slimPSI(fixture)
    for (const strategy of ['mobile', 'desktop'] as const) {
      expect(summarizePSI(slim, URL_UNDER_TEST, strategy)).toEqual(summarizePSI(full, URL_UNDER_TEST, strategy))
    }
    expect(summarizePSI(slim, URL_UNDER_TEST, 'mobile').score).toBe(99)
    expect(summarizePSI(slim, URL_UNDER_TEST, 'mobile').lcpMs).toBeGreaterThan(0)
  })

  it('keeps runtimeError and runWarnings, dropping unrelated fields', () => {
    const slim = slimPSI({
      lighthouseResult: {
        runWarnings: ['slow network', 42],
        runtimeError: { code: 'NO_FCP', message: 'no paint', stack: 'dropped' },
        fullPageScreenshot: { screenshot: { data: 'data:image/jpeg;base64,xxx' } },
      },
    })
    expect(slim).toEqual({
      lighthouseResult: { runWarnings: ['slow network'], runtimeError: { code: 'NO_FCP', message: 'no paint' } },
    })
  })
})
