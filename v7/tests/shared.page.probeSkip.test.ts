import { describe, expect, it } from 'vitest'

import { pageFromEvents } from '@/shared/page'
import type { EventRec } from '@/background/pipeline/types'

const makeDoc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('pageFromEvents live HEAD probe', () => {
  it('skips the probe when events already carry main-frame headers and status', async () => {
    const url = 'https://probe.test/a'
    const events = [
      { t: 'nav:commit', u: url },
      { t: 'req:mainHeaders', u: url, h: { 'content-type': 'text/html' }, sc: 200 },
      { t: 'req:mainDone', u: url, s: 200 },
      { t: 'dom:document_end', d: { html: '<!doctype html><title>t</title>' } },
    ] as unknown as EventRec[]
    let calls = 0
    const probe = async () => { calls++; return { status: 999, headers: { 'x-probe': '1' } } }
    const p = await pageFromEvents(events, makeDoc, () => url, probe)
    expect(calls).toBe(0)
    expect(p.status).toBe(200)
    expect(p.headers?.['content-type']).toBe('text/html')
    expect(p.headerSource).toBe('events')
  })

  it('still probes when events lack main-frame headers', async () => {
    const url = 'https://probe.test/b'
    const events = [
      { t: 'nav:commit', u: url },
      { t: 'dom:document_end', d: { html: '<!doctype html><title>t</title>' } },
    ] as unknown as EventRec[]
    let calls = 0
    const probe = async () => { calls++; return { status: 200, headers: { 'content-type': 'text/html' } } }
    const p = await pageFromEvents(events, makeDoc, () => url, probe)
    expect(calls).toBe(1)
    expect(p.status).toBe(200)
    expect(p.headerSource).toBe('probe')
  })
})
