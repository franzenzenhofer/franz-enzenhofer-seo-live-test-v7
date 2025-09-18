import { describe, it, expect } from 'vitest'

import { pageFromHtml } from '@/shared/page'

describe('pageFromHtml', () => {
  it('builds a Page with head probe', async () => {
    const html = '<!doctype html><title>T</title><p>x</p>'
    const makeDoc = (s: string) => new DOMParser().parseFromString(s, 'text/html')
    const probe = async () => ({ status: 200, headers: { 'content-type': 'text/html' } })
    const p = await pageFromHtml(html, 'https://a.com', makeDoc, probe)
    expect(p.doc.title).toBe('T')
    expect(p.status).toBe(200)
    expect(p.headers?.['content-type']).toBe('text/html')
  })
})

