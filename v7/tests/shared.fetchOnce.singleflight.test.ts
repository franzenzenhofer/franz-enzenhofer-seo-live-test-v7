import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchStatusTextOnce, fetchTextOnce } from '@/shared/fetchOnce'

const resp = (status: number, body: string) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => body,
})

describe('fetchOnce single-flight', () => {
  afterEach(() => vi.restoreAllMocks())

  it('collapses concurrent callers of the same URL onto one request', async () => {
    const f = vi.fn().mockResolvedValue(resp(200, 'User-agent: *'))
    vi.stubGlobal('fetch', f)
    const [a, b, c] = await Promise.all([
      fetchStatusTextOnce('https://one.test/robots.txt'),
      fetchTextOnce('https://one.test/robots.txt'),
      fetchStatusTextOnce('https://one.test/robots.txt'),
    ])
    expect(f).toHaveBeenCalledTimes(1)
    expect(a).toEqual({ status: 200, ok: true, text: 'User-agent: *', bytes: 13, truncated: false })
    expect(b).toBe('User-agent: *')
    expect(c).toEqual(a)
  })

  it('exposes status and body on non-ok responses; fetchTextOnce maps them to null', async () => {
    const f = vi.fn().mockResolvedValue(resp(404, 'nope'))
    vi.stubGlobal('fetch', f)
    const full = await fetchStatusTextOnce('https://two.test/robots.txt')
    const text = await fetchTextOnce('https://two.test/robots.txt')
    expect(f).toHaveBeenCalledTimes(1)
    expect(full).toEqual({ status: 404, ok: false, text: 'nope', bytes: 4, truncated: false })
    expect(text).toBeNull()
  })

  it('does not freeze a network failure: the next call retries', async () => {
    const f = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(resp(200, 'ok'))
    vi.stubGlobal('fetch', f)
    expect(await fetchStatusTextOnce('https://three.test/robots.txt')).toBeNull()
    expect(await fetchStatusTextOnce('https://three.test/robots.txt')).toEqual({ status: 200, ok: true, text: 'ok', bytes: 2, truncated: false })
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('keeps only the first 500 KiB and says the body was cut', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp(200, 'a'.repeat(512_050))))
    const full = await fetchStatusTextOnce('https://big.test/robots.txt')
    expect(full?.truncated).toBe(true)
    expect(full?.bytes).toBe(512_000)
    expect(full?.text.length).toBe(512_000)
  })

  it('blocks non-http URLs without fetching', async () => {
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await fetchStatusTextOnce('chrome-extension://x/robots.txt')).toBeNull()
    expect(await fetchTextOnce('ftp://four.test/robots.txt')).toBeNull()
    expect(f).not.toHaveBeenCalled()
  })
})
