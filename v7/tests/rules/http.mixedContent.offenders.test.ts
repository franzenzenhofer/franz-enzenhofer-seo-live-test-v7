import { describe, expect, it } from 'vitest'

import { mixedContentRule } from '@/rules/http/mixedContent'
import { boundResult } from '@/shared/boundResult'
import { collectDomFacts } from '@/shared/domFacts.collect'
import { domFactsToDocument } from '@/shared/domFacts.document'
import { readResourceIssues } from '@/shared/resourceIssues'

const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const run = (html: string, resources: string[] = []) => mixedContentRule.run({
  html, doc: doc(html), url: 'https://example.test', resources,
}, { globals: {} })

describe('actionable mixed-content evidence', () => {
  it('names the image and attribute, keeping HTTP markup an error even with an HTTPS network URL', async () => {
    const result = await run('<img src="http://cdn.test/trip.jpg?v=1" alt="Alpe-Adria 8 Tage">', ['https://cdn.test/trip.jpg?v=1'])
    expect(result.type).toBe('error')
    expect(result.message).toContain('1 image')
    expect(result.message).not.toContain('loaded')
    expect(readResourceIssues(result.details?.['resourceIssues'])).toEqual([{
      name: 'Alpe-Adria 8 Tage', kind: 'Image', url: 'http://cdn.test/trip.jpg?v=1',
      location: '<img> src', selector: 'img[src="http://cdn.test/trip.jpg?v=1"]',
    }])
    expect(result.details?.['snippet']).toBeUndefined()
  })

  it('keeps network-only offenders and forms visible alongside HTML offenders without double-counting capture', async () => {
    const result = await run('<img src="http://cdn.test/a.jpg"><form action="http://example.test/send" aria-label="Contact"></form>', [
      'http://cdn.test/a.jpg', 'http://cdn.test/app.js', 'http://cdn.test/app.js',
    ])
    expect(result.details?.['count']).toBe(2)
    const issues = readResourceIssues(result.details?.['resourceIssues'])
    expect(issues.map((issue) => issue.name)).toEqual(['a.jpg', 'app.js', 'Contact'])
    expect(issues[1]?.selector).toBeUndefined()
    expect(result.message).toContain('1 form')
  })

  it('preserves repeated element occurrences in page order and handles uppercase link relations', async () => {
    const result = await run('<img src="http://cdn.test/a.jpg" alt="First"><link rel="STYLESHEET" href="http://cdn.test/main.css"><img src="http://cdn.test/a.jpg" alt="Second">')
    expect(readResourceIssues(result.details?.['resourceIssues']).map((issue) => issue.name)).toEqual(['First', 'main.css', 'Second'])
    expect(result.details?.['count']).toBe(3)
  })

  it('produces selectors that match the original page after compact DOM reconstruction', async () => {
    const original = doc('<main><div><img src="https://cdn.test/ok.jpg"><img src=" http://cdn.test/a.jpg?x=&quot;q&quot; " alt="Trip"></div></main>')
    const rebuilt = domFactsToDocument(collectDomFacts(original, 'static'), doc)
    const result = await mixedContentRule.run({ html: '', doc: rebuilt, url: 'https://example.test' }, { globals: {} })
    const issue = readResourceIssues(result.details?.['resourceIssues'])[0]!
    expect(original.querySelector(issue.selector!)?.getAttribute('alt')).toBe('Trip')
  })

  it('retains ten named long-URL offenders through the storage bound without a repeated HTML dump', async () => {
    const html = Array.from({ length: 10 }, (_, i) => `<img src="http://www.example.com/Reisen/titelbilder/image-thumb__107737__lightbox/${'long-image-name-'.repeat(10)}${i}.jpg?v=1743694656" alt="Alpe-Adria ${i}">`).join('')
    const result = boundResult(await run(html))
    const issues = readResourceIssues(result.details?.['resourceIssues'])
    expect(issues).toHaveLength(10)
    expect(JSON.stringify(issues)).not.toContain('[truncated]')
    expect(result.details?.['offenders']).toBeUndefined()
  })
})
