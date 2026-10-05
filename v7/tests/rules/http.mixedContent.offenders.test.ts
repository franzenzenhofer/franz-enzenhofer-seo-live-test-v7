import { describe, expect, it } from 'vitest'

import { mixedContentRule } from '@/rules/http/mixedContent'
import { boundResult } from '@/shared/boundResult'
import { collectDomFacts } from '@/shared/domFacts.collect'
import { domFactsToDocument } from '@/shared/domFacts.document'

const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const run = (html: string, resources: string[] = []) => mixedContentRule.run({
  html, doc: doc(html), url: 'https://example.test', resources,
}, { globals: {} })

describe('actionable mixed-content evidence', () => {
  it('names the image and attribute, keeping HTTP markup an error even with an HTTPS network URL', async () => {
    const result = await run('<img src="http://cdn.test/trip.jpg?v=1" alt="Alpe-Adria 8 Tage">', ['https://cdn.test/trip.jpg?v=1'])
    expect(result.type).toBe('error')
    expect(result.presentation?.values).toContainEqual({ key: 'HTTP references', value: '1 image', kind: 'text' })
    // The offending element itself is the overview's observed value, keyed by its tag.
    expect(result.presentation?.values.at(-1)).toMatchObject({ key: '<img>', kind: 'original', value: '<img src="http://cdn.test/trip.jpg?v=1" alt="Alpe-Adria 8 Tage">' })
    const record = result.presentation?.evidence[0]
    expect(record?.name).toBe('<img>')
    expect(record?.fields).toContainEqual({ key: 'Kind', value: 'Image', kind: 'text' })
    expect(record?.fields).toContainEqual({ key: 'Label', value: 'Alpe-Adria 8 Tage', kind: 'text' })
    expect(record?.fields).toContainEqual({ key: 'HTTP URL', value: 'http://cdn.test/trip.jpg?v=1', kind: 'url' })
    expect(record?.fields).toContainEqual({ key: 'Location', value: '<img> src', kind: 'text' })
    expect(record?.fields).toContainEqual({ key: 'DOM path', value: 'img[src="http://cdn.test/trip.jpg?v=1"]', kind: 'path' })
    expect(result.presentation?.markup).toHaveLength(1)
    expect(result.presentation?.markup[0]?.value).toBe('<img src="http://cdn.test/trip.jpg?v=1" alt="Alpe-Adria 8 Tage">')
  })

  it('keeps network-only offenders and forms visible alongside HTML offenders without double-counting capture', async () => {
    const result = await run('<img src="http://cdn.test/a.jpg"><form action="http://example.test/send" aria-label="Contact"></form>', [
      'http://cdn.test/a.jpg', 'http://cdn.test/app.js', 'http://cdn.test/app.js',
    ])
    expect(result.presentation?.values).toContainEqual({ key: 'HTTP references', value: '1 image, 1 network resource, 1 form', kind: 'text' })
    const names = result.presentation?.evidence.map((e) => e.fields.find((f) => f.key === 'Label')?.value)
    expect(names).toEqual(['a.jpg', 'app.js', 'Contact'])
    expect(result.presentation?.evidence.map((e) => e.name)).toEqual(['<img>', 'Network resource', '<form>'])
    // Three offenders found, two with markup: the four count rows say so.
    expect(result.presentation?.detailValues).toContainEqual({ key: 'Markup retained', value: 2, kind: 'text' })
    expect(result.presentation?.detailValues).toContainEqual({ key: 'Markup omitted', value: 1, kind: 'text' })
    expect(result.presentation?.detailValues).toContainEqual({ key: 'Evidence retained', value: 3, kind: 'text' })
    // The network-only offender (app.js) has no source element, so no DOM path.
    expect(result.presentation?.evidence[1]?.fields.some((f) => f.key === 'DOM path')).toBe(false)
  })

  it('preserves repeated element occurrences in page order and handles uppercase link relations', async () => {
    const result = await run('<img src="http://cdn.test/a.jpg" alt="First"><link rel="STYLESHEET" href="http://cdn.test/main.css"><img src="http://cdn.test/a.jpg" alt="Second">')
    const names = result.presentation?.evidence.map((e) => e.fields.find((f) => f.key === 'Label')?.value)
    expect(names).toEqual(['First', 'main.css', 'Second'])
    expect(result.presentation?.evidence.map((e) => e.name)).toEqual(['<img> 1', '<link rel="stylesheet">', '<img> 2'])
    expect(result.presentation?.values).toContainEqual({ key: 'HTTP references', value: '2 images, 1 stylesheet', kind: 'text' })
  })

  it('produces a DOM path that matches the original page after compact DOM reconstruction', async () => {
    const original = doc('<main><div><img src="https://cdn.test/ok.jpg"><img src=" http://cdn.test/a.jpg?x=&quot;q&quot; " alt="Trip"></div></main>')
    const rebuilt = domFactsToDocument(collectDomFacts(original, 'static'), doc)
    const result = await mixedContentRule.run({ html: '', doc: rebuilt, url: 'https://example.test' }, { globals: {} })
    const selector = result.presentation?.evidence[0]?.fields.find((f) => f.key === 'DOM path')?.value as string
    expect(original.querySelector(selector)?.getAttribute('alt')).toBe('Trip')
  })

  it('keeps every whole offender record - never a truncated original - when ten long-URL offenders are found', async () => {
    const html = Array.from({ length: 10 }, (_, i) => `<img src="http://www.example.com/Reisen/titelbilder/image-thumb__107737__lightbox/${'long-image-name-'.repeat(10)}${i}.jpg?v=1743694656" alt="Alpe-Adria ${i}">`).join('')
    const raw = await run(html)
    const result = boundResult(raw)
    expect(result.presentation?.evidence).toHaveLength(10)
    expect(result.presentation?.markup).toEqual(raw.presentation?.markup)
    expect(JSON.stringify(result.presentation)).not.toContain('[truncated]')
  })
})
