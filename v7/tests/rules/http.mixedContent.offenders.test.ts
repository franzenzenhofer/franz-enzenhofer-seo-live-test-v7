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
    expect(result.presentation?.values).toContainEqual({ key: 'Mixed-content resources', value: 1, kind: 'text' })
    const record = result.presentation?.evidence[0]
    expect(record?.fields).toContainEqual({ key: 'Kind', value: 'Image', kind: 'text' })
    expect(record?.fields).toContainEqual({ key: 'Element label (excerpt)', value: 'Alpe-Adria 8 Tage', kind: 'text' })
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
    expect(result.presentation?.values).toContainEqual({ key: 'Mixed-content resources', value: 2, kind: 'text' })
    expect(result.presentation?.values).toContainEqual({ key: 'Insecure form actions', value: 1, kind: 'text' })
    const names = result.presentation?.evidence.map((e) => e.fields.find((f) => f.key === 'Element label (excerpt)')?.value)
    expect(names).toEqual(['a.jpg', 'app.js', 'Contact'])
    // The network-only offender (app.js) has no source element, so no DOM path.
    expect(result.presentation?.evidence[1]?.fields.some((f) => f.key === 'DOM path')).toBe(false)
  })

  it('preserves repeated element occurrences in page order and handles uppercase link relations', async () => {
    const result = await run('<img src="http://cdn.test/a.jpg" alt="First"><link rel="STYLESHEET" href="http://cdn.test/main.css"><img src="http://cdn.test/a.jpg" alt="Second">')
    const names = result.presentation?.evidence.map((e) => e.fields.find((f) => f.key === 'Element label (excerpt)')?.value)
    expect(names).toEqual(['First', 'main.css', 'Second'])
    expect(result.presentation?.values).toContainEqual({ key: 'Mixed-content resources', value: 3, kind: 'text' })
  })

  it('produces a DOM path that matches the original page after compact DOM reconstruction', async () => {
    const original = doc('<main><div><img src="https://cdn.test/ok.jpg"><img src=" http://cdn.test/a.jpg?x=&quot;q&quot; " alt="Trip"></div></main>')
    const rebuilt = domFactsToDocument(collectDomFacts(original, 'static'), doc)
    const result = await mixedContentRule.run({ html: '', doc: rebuilt, url: 'https://example.test' }, { globals: {} })
    const selector = result.presentation?.evidence[0]?.fields.find((f) => f.key === 'DOM path')?.value as string
    expect(original.querySelector(selector)?.getAttribute('alt')).toBe('Trip')
  })

  it('omits the whole evidence/markup set - never a partial or truncated original - when ten long-URL offenders exceed the storage bound', async () => {
    const html = Array.from({ length: 10 }, (_, i) => `<img src="http://www.example.com/Reisen/titelbilder/image-thumb__107737__lightbox/${'long-image-name-'.repeat(10)}${i}.jpg?v=1743694656" alt="Alpe-Adria ${i}">`).join('')
    const result = boundResult(await run(html))
    expect(result.presentation?.evidence).toHaveLength(0)
    expect(result.presentation?.markup).toHaveLength(0)
    expect(result.presentation?.noMarkup).toContain('10 record(s)')
    expect(result.presentation?.detailValues).toContainEqual({ key: 'Evidence records omitted', value: 10, kind: 'text' })
    expect(JSON.stringify(result.presentation)).not.toContain('[truncated]')
  })
})
