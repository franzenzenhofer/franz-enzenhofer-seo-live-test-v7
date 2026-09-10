import { describe, expect, it } from 'vitest'

import { withAnonymity } from '@/shared/probeFetch'
import { UnsafeProbeError } from '@/shared/probeSafety'

describe('anonymous probe fetch', () => {
  it('always omits credentials, whatever the caller asked for', async () => {
    const seen: Array<RequestInit | undefined> = []
    const base = (async (_input: RequestInfo | URL, init?: RequestInit) => { seen.push(init); return {} as Response }) as typeof fetch
    await withAnonymity(base)('https://site.test/a', { credentials: 'include', redirect: 'manual' })
    expect(seen).toEqual([{ credentials: 'omit', redirect: 'manual' }])
  })

  it('refuses back-office, action and token URLs before any request is made', async () => {
    let calls = 0
    const base = (async () => { calls += 1; return {} as Response }) as typeof fetch
    await expect(withAnonymity(base)('https://site.test/wp-admin/post.php?action=trash')).rejects.toThrow(UnsafeProbeError)
    await expect(withAnonymity(base)(new URL('https://site.test/?_wpnonce=x'))).rejects.toThrow(UnsafeProbeError)
    expect(calls).toBe(0)
  })
})
