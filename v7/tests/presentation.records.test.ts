import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

import { boundPresentation } from '@/shared/presentation/bound'
import { urlComparison } from '@/shared/presentation/comparison'
import { createPresentation, textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { tagLabel, tagLabels } from '@/shared/presentation/tagLabel'

const doc = (html: string) => new JSDOM(html).window.document

describe('shared element records (FORMATTING.md F4-F7)', () => {
  it('labels an element by its tag and identifying attribute', () => {
    const d = doc('<head><link rel="canonical" href="/a"><link rel="alternate" hreflang="de-AT" href="/de"><meta name="Robots" content="noindex"><meta charset="utf-8"><script type="application/ld+json">{}</script><title>T</title></head>')
    expect([...d.head.children].map(tagLabel)).toEqual(['<link rel="canonical">', '<link hreflang="de-at">', '<meta name="robots">', '<meta charset>', '<script type="application/ld+json">', '<title>'])
    expect(tagLabels([...d.querySelectorAll('link[rel=canonical], title, link[rel=canonical]')])).toEqual(['<link rel="canonical">', '<title>'])
    const twice = doc('<link rel="canonical" href="/a"><link rel="canonical" href="/b">')
    expect(tagLabels([...twice.querySelectorAll('link')])).toEqual(['<link rel="canonical"> 1', '<link rel="canonical"> 2'])
  })
  it('ships one original field and one evidence record per element with truthful counts', () => {
    const d = doc('<head><link rel="alternate" hreflang="en" href="https://x.test/en"><link rel="alternate" hreflang="de" href="https://x.test/de"></head>')
    const links = [...d.querySelectorAll('link')]
    const records = elementRecords(links, 5, (element) => [textField('hreflang', element.getAttribute('hreflang')!)])
    expect(records.markup.map((field) => field.key)).toEqual(['<link hreflang="en">', '<link hreflang="de">'])
    expect(records.markup[0]!.value).toBe(links[0]!.outerHTML)
    expect(records.evidence[1]).toEqual({ name: '<link hreflang="de">', fields: [textField('hreflang', 'de'), expect.objectContaining({ key: 'DOM path', kind: 'path' })] })
    expect(records.counts).toEqual([textField('Markup retained', 2), textField('Markup omitted', 3), textField('Evidence retained', 2), textField('Evidence omitted', 3)])
  })
  it('keeps the count rows truthful when the storage bound drops records', () => {
    const links = Array.from({ length: 300 }, (_, index) => `<link rel="alternate" hreflang="l${index}" href="https://www.example.test/${'p'.repeat(150)}/${index}">`).join('')
    const records = elementRecords([...doc(links).querySelectorAll('link')], 300)
    const view = boundPresentation(createPresentation({ name: 'Hreflang', input: 'Static DOM', pageUrl: 'https://x.test/', values: [textField('Hreflang links', 300)],
      checked: [textField('Selector', 'link')], detailValues: records.counts, markup: records.markup, evidence: records.evidence }))
    const count = (key: string) => view.detailValues.find((field) => field.key === key)?.value
    expect(count('Markup retained')).toBe(view.markup.length)
    expect(count('Evidence retained')).toBe(view.evidence.length)
    expect(Number(count('Markup retained')) + Number(count('Markup omitted'))).toBe(300)
    expect(Number(count('Evidence retained')) + Number(count('Evidence omitted'))).toBe(300)
    expect(view.markup.length).toBeGreaterThan(0)
  })
  it('names the first differing URL component in a closed verdict', () => {
    expect(urlComparison('https://g.test/@r', 'https://g.test/@r?hl=en', 'current page URL')).toBe('Differs from current page URL (query)')
    expect(urlComparison('https://g.test/', 'https://g.test/', 'current page URL')).toBe('Equals current page URL')
    expect(urlComparison('http://g.test/', 'https://g.test/', 'final URL')).toBe('Differs from final URL (scheme)')
  })
})
