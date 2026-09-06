import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsNoindexUnsupportedRule } from '@/rules/robots/noindexUnsupported'

const page = (url: string) => ({ html: '', url, doc: new DOMParser().parseFromString('<p/>', 'text/html') })

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

const serve = (body: string, status = 200) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: status < 400, status, text: async () => body }))

describe('rule: unsupported robots.txt noindex', () => {
  it('reports each unsupported noindex record with its line', async () => {
    serve('User-agent: *\nDisallow: /blocked/\nNoindex: /private/\n# Noindex: /commented/\nnoindex:/other\n')
    const r = await robotsNoindexUnsupportedRule.run(page('https://a.test/x') as never, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.details?.['count']).toBe(2)
    expect(r.details?.['occurrences']).toEqual([
      { line: 3, value: '/private/' },
      { line: 5, value: '/other' },
    ])
    expect(r.message).toContain('Google ignores these')
  })

  it('stays quiet on a robots.txt without noindex records', async () => {
    serve('User-agent: *\nDisallow: /blocked/\n')
    const r = await robotsNoindexUnsupportedRule.run(page('https://b.test/x') as never, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.details?.['count']).toBe(0)
  })

  it('says so when robots.txt is unreachable instead of claiming a clean result', async () => {
    serve('', 404)
    const r = await robotsNoindexUnsupportedRule.run(page('https://c.test/x') as never, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.message).toContain('No readable robots.txt')
    expect(r.details?.['status']).toBe(404)
  })
})
