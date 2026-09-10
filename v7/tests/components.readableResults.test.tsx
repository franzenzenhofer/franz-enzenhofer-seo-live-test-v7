import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ResultDetails } from '@/components/result/ResultDetails'
import { toResultCopyPayload } from '@/components/result/resultCopy'
import { resultPreview, resultValue } from '@/shared/resultPreview'
import { readableDetail } from '@/shared/readableDetails'

const details = {
  effective: { directives: [{ ua: 'googlebot', value: 'noindex, nofollow', source: 'meta' }], noindex: true, nofollow: true },
  locations: [{ url: 'https://example.test/page', status: 404, problem: 'Broken target' }],
}
describe('readable results across every presentation', () => {
  it('never coerces nested evidence into object placeholders or JSON', () => {
    const preview = resultPreview(details)
    const expanded = renderToStaticMarkup(<ResultDetails details={details} />)
    const copied = toResultCopyPayload({ name: 'Indexing', label: 'DISCOVER', message: 'Noindex found', type: 'warn', details })
    for (const output of [preview, expanded, copied]) {
      expect(output).not.toContain('[object Object]')
      expect(output).not.toMatch(/"(?:directives|noindex|url)":/)
    }
    expect(expanded).toContain('Instructions found')
    expect(expanded).toContain('Blocks search indexing')
    expect(expanded).toContain('Broken target')
    expect(copied).toContain('noindex, nofollow')
    expect(copied).toContain('https://example.test/page')
    expect(copied).toContain('404')
  })
  it('copies full evidence while keeping a compact preview', () => {
    const record = { values: { first: 'a'.repeat(200), last: 'Final evidence' } }
    expect(resultPreview(record).length).toBeLessThanOrEqual(160)
    expect(resultValue(record)).toContain('Final evidence')
    expect(readableDetail({ flag: false, count: 0 })).toContain('Flag: no')
    expect(readableDetail({ flag: false, count: 0 })).toContain('Count: 0')
  })
})
