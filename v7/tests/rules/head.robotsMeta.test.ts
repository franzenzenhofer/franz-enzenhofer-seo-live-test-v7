import { describe, expect, it } from 'vitest'

import { robotsMetaRule } from '@/rules/head/robotsMeta'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = (html: string) => robotsMetaRule.run({ html, url: 'https://ex.com', doc: doc(html) } as any, { globals: {} } as any)

describe('rule: robots meta', () => {
  it('reports absence as info', async () => {
    const res = await run('<html><head></head></html>')
    expect(res.type).toBe('info')
    expect(res.message).toMatch(/No robots meta/)
  })

  it('reports a single harmless tag as info', async () => {
    const res = await run('<meta name="robots" content="index,follow">')
    expect(res.type).toBe('info')
    expect(res.message).toContain('index,follow')
  })

  it('warns on noindex in a single tag', async () => {
    const res = await run('<meta name="robots" content="noindex">')
    expect(res.type).toBe('warn')
    expect((res.details as any).hasNoindex).toBe(true)
  })

  it('combines multiple robots meta tags instead of warning on multiplicity', async () => {
    const res = await run('<meta name="robots" content="max-image-preview:large"><meta name="robots" content="notranslate">')
    expect(res.type).toBe('info')
    expect((res.details as any).count).toBe(2)
    expect((res.details as any).hasNoindex).toBe(false)
  })

  it('surfaces noindex hidden in one of several robots meta tags', async () => {
    const res = await run('<meta name="robots" content="noindex"><meta name="robots" content="nofollow">')
    expect(res.type).toBe('warn')
    expect((res.details as any).hasNoindex).toBe(true)
    expect((res.details as any).hasNofollow).toBe(true)
    expect((res.details as any).count).toBe(2)
  })
})
