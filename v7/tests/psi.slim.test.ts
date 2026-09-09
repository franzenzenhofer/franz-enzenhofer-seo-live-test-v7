import { describe, it, expect, vi, beforeEach } from 'vitest'

import fixture from './fixtures/psi-mobile-full.json'

import { summarizePSI } from '@/rules/google/psi/summary'
import { runPSI } from '@/shared/psi'
import { slimPSI, type PSIResult } from '@/shared/psiSlim'

// Realistic chrome.storage.session shim: get(null) returns everything, remove() deletes keys.
const session = new Map<string, unknown>()
const shimSession = () => {
  session.clear()
  ;(globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      session: {
        get: async (k: string | null) =>
          k === null ? Object.fromEntries(session) : { [k]: session.get(k) },
        set: async (o: Record<string, unknown>) => { Object.entries(o).forEach(([k, v]) => session.set(k, v)) },
        remove: async (keys: string | string[]) => { (Array.isArray(keys) ? keys : [keys]).forEach((k) => session.delete(k)) },
      },
    },
  }
}

const bytes = (v: unknown) => JSON.stringify(v).length
const URL_UNDER_TEST = 'https://www.octenisept.at/'
const CACHE_KEY = `psi:K:mobile:${URL_UNDER_TEST}`
const TTL_MS = 5 * 60_000

beforeEach(() => {
  shimSession()
  vi.restoreAllMocks()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => fixture }) as unknown as Response))
})

describe('runPSI caches a slim projection, not the full Lighthouse payload', () => {
  it('writes an entry without screenshots that is far below 5 KB', async () => {
    const returned = await runPSI(URL_UNDER_TEST, 'mobile', 'K')
    const entry = session.get(CACHE_KEY) as { ts: number; data: PSIResult }

    const before = bytes(fixture)
    const after = bytes(entry)
    console.log(`[psi.slim] cached entry bytes: before=${before} after=${after} ratio=${(before / after).toFixed(0)}x`)

    expect(before).toBeGreaterThan(50_000)
    expect(after).toBeLessThan(5_000)
    expect(JSON.stringify(entry)).not.toMatch(/base64|screenshot|thumbnails|network-requests/)
    expect(entry.data.lighthouseResult).not.toHaveProperty('fullPageScreenshot')
    expect(Object.keys(entry.data.lighthouseResult?.audits ?? {}).sort()).toEqual([
      'cumulative-layout-shift',
      'first-contentful-paint',
      'largest-contentful-paint',
      'speed-index',
      'total-blocking-time',
    ])
    // One value: what the rules get back is exactly what was cached.
    expect(returned).toEqual(entry.data)
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

describe('runPSI evicts expired psi: entries when it writes', () => {
  it('removes entries older than the TTL and keeps fresh and foreign keys', async () => {
    vi.useFakeTimers()
    const t0 = Date.now()
    session.set('psi:K:mobile:https://stale.example/', { ts: t0 - TTL_MS - 1, data: {} })
    session.set('psi:K:desktop:https://fresh.example/', { ts: t0 - 1000, data: {} })
    session.set('logs:1', ['keep me'])

    await runPSI(URL_UNDER_TEST, 'mobile', 'K')

    expect(session.has('psi:K:mobile:https://stale.example/')).toBe(false)
    expect(session.has('psi:K:desktop:https://fresh.example/')).toBe(true)
    expect(session.get('logs:1')).toEqual(['keep me'])
    expect(session.has(CACHE_KEY)).toBe(true)
    vi.useRealTimers()
  })
})
