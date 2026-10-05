import { describe, it, expect } from 'vitest'
import { relAlternateMediaRule } from '@/rules/head/relAlternateMedia'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = (html: string) => relAlternateMediaRule.run({ html: '', url: 'https://example.test/page', doc: doc(html) }, { globals: {} })

describe('rule: rel alternate media', () => {
  it('reports a single media link as its URL plus the complete element', async () => {
    const html = '<link rel="alternate" media="only screen and (max-width: 640px)" href="m.html">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(600)
    expect(r.presentation?.input).toBe('Idle DOM')
    expect(r.presentation?.values).toEqual([
      { key: 'Alternate URL', value: 'm.html', kind: 'url' },
      { key: '<link rel="alternate">', value: html, kind: 'original', fidelity: 'complete-original' },
    ])
    expect(r.presentation?.evidence).toEqual([{ name: '<link rel="alternate">', fields: [
      { key: 'media', value: 'only screen and (max-width: 640px)', kind: 'text' }, { key: 'href', value: 'm.html', kind: 'url' },
      { key: 'DOM path', value: expect.any(String), kind: 'path' },
    ] }])
    expect(r.presentation?.checked).toContainEqual({ key: 'Selection', value: 'All matches', kind: 'text' })
    expect(toResultCopyPayload(r)).toContain('https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing')
    expect(r.label).toBe('HEAD')
    expect(r.details).toBeUndefined()
  })

  it('reports absence as information', async () => {
    const r = await run('<head></head>')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.values).toContainEqual({ key: 'Alternate media link', value: 'Not found', kind: 'text' })
    expect(r.presentation?.noMarkup).toBe('No matching alternate media link found')
    expect(r.presentation?.evidence).toEqual([])
  })

  it('reports each link individually when a few are present: the count, then every element', async () => {
    const html = '<link rel="alternate" media="screen-1" href="/m-1"><link rel="alternate" media="screen-2" href="/m-2">'
    const r = await run(html)
    expect(r.presentation?.values.map(({ key }) => key)).toEqual(['Media links', '<link rel="alternate"> 1', '<link rel="alternate"> 2'])
    expect(r.presentation?.values[0]).toEqual({ key: 'Media links', value: 2, kind: 'text' })
    expect(r.presentation?.evidence).toHaveLength(2)
    expect(r.presentation?.evidence[0]).toEqual({ name: '<link rel="alternate"> 1', fields: [
      { key: 'media', value: 'screen-1', kind: 'text' },
      { key: 'href', value: '/m-1', kind: 'url' },
      { key: 'DOM path', value: expect.any(String), kind: 'path' },
    ] })
  })

  it('retains a bounded sample with a media-query summary and reports omitted links in the four count rows', async () => {
    const html = Array.from({ length: 12 }, (_, index) => `<link rel="alternate" media="screen-${index}" href="/m-${index}">`).join('')
    const r = await run(html)
    expect(r.presentation?.values).toEqual([
      { key: 'Media links', value: 12, kind: 'text' },
      { key: 'Media queries', value: 'screen-0, screen-1, screen-2, screen-3, screen-4 … 7 more', kind: 'text' },
    ])
    expect(r.presentation?.detailValues).toEqual([
      { key: 'Markup retained', value: 10, kind: 'text' }, { key: 'Markup omitted', value: 2, kind: 'text' },
      { key: 'Evidence retained', value: 10, kind: 'text' }, { key: 'Evidence omitted', value: 2, kind: 'text' },
    ])
    expect(r.presentation?.markup).toHaveLength(10)
    expect(r.presentation?.evidence).toHaveLength(10)
  })
})
