import { describe, it, expect } from 'vitest'

import { pageFromEvents } from '@/shared/page'

const makeDoc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('Page shape completeness', () => {
  it('holds DOM phases, urls, headers, status and resources', async () => {
    const url = 'https://a.example/x?foo=1#hash'
    const base = 'https://a.example/x'
    const dcl = '<!doctype html><title>DCL</title>'
    const end = '<!doctype html><title>End</title>'
    const idle = '<!doctype html><title>Idle</title><meta name="robots" content="all">'

    const events = [
      { t: 'nav:before', u: base },
      { t: 'nav:commit', u: url },
      { t: 'req:headers', u: url, h: { Status: '200', 'Content-Type': 'text/html; charset=utf-8' } },
      { t: 'req:done', u: url, s: 200 },
      { t: 'req:headers', u: 'https://a.example/img.png', h: { Status: '200' } },
      { t: 'dom:DOMContentLoaded', d: { html: dcl } },
      { t: 'dom:document_end', d: { html: end } },
      { t: 'dom:document_idle', d: { html: idle } },
    ] as unknown as import('@/background/pipeline/types').EventRec[]

    const probe = async () => ({}) // avoid network
    const p = await pageFromEvents(events, makeDoc, ()=>'about:blank', probe)

    // Core - prefers document_end over idle
    expect(p.url).toBe(url)
    expect(p.html.includes('End')).toBe(true)
    expect(p.doc.title).toBe('End')
    expect(p.status).toBe(200)
    expect(p.headers?.['content-type']).toContain('text/html')
    expect(p.resources?.some((r)=> r.endsWith('/img.png'))).toBe(true)

    // Enriched/optional
    expect(p.firstUrl).toBe('https://a.example/x')
    expect(p.lastUrl).toBe(url)
    expect(p.rawHeaders?.['Content-Type']).toContain('text/html')
    expect(p.domContentLoadedDoc?.title).toBe('DCL')
    expect(p.domEndDoc?.title).toBe('End')
    expect(p.domIdleDoc?.title).toBe('Idle')
  })
})
