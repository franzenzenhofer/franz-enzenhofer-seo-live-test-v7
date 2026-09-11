import { describe, it, expect } from 'vitest'
import { relAlternateMediaRule } from '@/rules/head/relAlternateMedia'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: rel alternate media', () => {
  it('reports a single media link with its exact values and complete markup', async () => {
    const html = '<link rel="alternate" media="only screen and (max-width: 640px)" href="m.html">'
    const r = await relAlternateMediaRule.run({ html: '', url: 'https://example.test/page', doc: doc(html) }, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(600)
    expect(r.presentation?.input).toBe('Idle DOM')
    expect(r.presentation?.values).toContainEqual({ key: 'Alternate media links', value: 1, kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Declared URL', value: 'm.html', kind: 'url' })
    expect(r.presentation?.markup[0]?.value).toBe(html)
    expect(r.presentation?.checked).toContainEqual({ key: 'Selection', value: 'All matches', kind: 'text' })
    expect(toResultCopyPayload(r)).toContain('https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing')
    expect(r.label).toBe('HEAD')
    expect(r.details).toBeUndefined()
  })

  it('reports absence as information', async () => {
    const r = await relAlternateMediaRule.run({ html: '', url: 'https://example.test/page', doc: doc('<head></head>') }, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.values).toContainEqual({ key: 'Alternate media links', value: 'Not found', kind: 'text' })
    expect(r.presentation?.noMarkup).toBe('No matching alternate media link found')
    expect(r.presentation?.evidence).toEqual([])
  })

  it('reports each link individually when multiple are present', async () => {
    const html = '<link rel="alternate" media="screen-1" href="/m-1"><link rel="alternate" media="screen-2" href="/m-2">'
    const r = await relAlternateMediaRule.run({ html: '', url: 'https://example.test/page', doc: doc(html) }, { globals: {} })
    expect(r.presentation?.values[0]).toEqual({ key: 'Alternate media links', value: 2, kind: 'text' })
    expect(r.presentation?.evidence).toHaveLength(2)
    expect(r.presentation?.evidence[0]).toEqual({ name: 'Alternate media link 1', fields: [
      { key: 'Media query', value: 'screen-1', kind: 'text' },
      { key: 'Declared URL', value: '/m-1', kind: 'url' },
      { key: 'DOM path', value: expect.any(String), kind: 'text' },
    ] })
  })

  it('retains a bounded sample and reports omitted links', async () => {
    const html = Array.from({ length: 12 }, (_, index) => `<link rel="alternate" media="screen-${index}" href="/m-${index}">`).join('')
    const r = await relAlternateMediaRule.run({ html: '', url: 'https://example.test/page', doc: doc(html) }, { globals: {} })
    expect(r.presentation?.values[0]?.value).toBe(12)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Links omitted', value: 2, kind: 'text' })
    expect(r.presentation?.markup).toHaveLength(10)
    expect(r.presentation?.evidence).toHaveLength(10)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Links shown', value: 10, kind: 'text' })
  })
})
