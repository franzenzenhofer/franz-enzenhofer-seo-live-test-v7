import { describe, it, expect } from 'vitest'

import { pageFromEvents } from '@/shared/page'

const makeDoc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('pageFromEvents enrich', () => {
  it('populates url/headers/status/resources and dom phases', async () => {
    const htmlIdle = '<!doctype html><title>Idle</title><meta name="robots" content="all">'
    const htmlEnd = '<!doctype html><title>End</title>'
    const events = [
      { t: 'nav:before', u: 'https://a.example/x' },
      { t: 'nav:commit', u: 'https://a.example/x' },
      { t: 'req:headers', u: 'https://a.example/x', h: { Status: '200', 'Content-Type': 'text/html' } },
      { t: 'req:done', u: 'https://a.example/x', s: 200 },
      { t: 'req:headers', u: 'https://a.example/r.png', h: { Status: '200' } },
      { t: 'dom:DOMContentLoaded', d: { html: '<!doctype html><title>DCL</title>' } },
      { t: 'dom:document_end', d: { html: htmlEnd } },
      { t: 'dom:document_idle', d: { html: htmlIdle } },
    ] as unknown as import('@/background/pipeline/types').EventRec[]

    const p = await pageFromEvents(events, makeDoc, ()=>'about:blank')
    expect(p.url).toBe('https://a.example/x')
    expect(p.status).toBe(200)
    expect(p.rawHeaders?.['Content-Type']).toBe('text/html')
    expect(p.resources?.includes('https://a.example/r.png')).toBe(true)
    // Optional enriched fields exist
    expect(p.domIdleDoc?.title).toBe('Idle')
    expect(p.domEndDoc?.title).toBe('End')
    expect(p.domContentLoadedDoc?.title).toBe('DCL')
    expect(p.firstUrl).toBe('https://a.example/x')
    expect(p.lastUrl).toBe('https://a.example/x')
  })

  it('falls back to probe headers when main-frame headers are missing', async () => {
    const url = 'https://a.example/x'
    const events = [
      { t: 'nav:before', u: url },
      { t: 'dom:document_idle', d: { html: '<!doctype html><title>Idle</title>' } },
      { t: 'req:headers', u: 'https://a.example/img.png', h: { Status: '200', 'Content-Type': 'image/png' } },
    ] as unknown as import('@/background/pipeline/types').EventRec[]
    const probe = async () => ({ status: 200, headers: { 'content-type': 'text/html', 'content-encoding': 'gzip' } })

    const p = await pageFromEvents(events, makeDoc, ()=>'about:blank', probe)
    expect(p.headers?.['content-encoding']).toBe('gzip')
    expect(p.headers?.['content-type']).toBe('text/html')
  })

  it('prefers the last navigation URL when present', async () => {
    const events = [
      { t: 'nav:before', u: 'https://a.example/start' },
      { t: 'nav:history', u: 'https://a.example/spa' },
      { t: 'dom:document_idle', d: { html: '<!doctype html><title>Idle</title>' } },
    ] as unknown as import('@/background/pipeline/types').EventRec[]

    const p = await pageFromEvents(events, makeDoc, ()=>'about:blank')
    expect(p.url).toBe('https://a.example/spa')
    expect(p.firstUrl).toBe('https://a.example/start')
    expect(p.lastUrl).toBe('https://a.example/spa')
  })
})
