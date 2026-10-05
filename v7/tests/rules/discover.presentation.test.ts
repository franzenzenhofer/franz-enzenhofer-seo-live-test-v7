import { describe, expect, it } from 'vitest'

import { overviewMarkup } from '@/rules/discover/discoverPresentation'
import { listRow } from '@/shared/presentation/listRow'
import { originalField } from '@/shared/presentation/create'

describe('discover overview rows', () => {
  it('keeps whole items within 60 characters and counts the rest', () => {
    const items = Array.from({ length: 14 }, (_, i) => `query ${i}`)
    expect(listRow(items)).toBe('query 0, query 1, query 2, query 3, query 4 … 9 more')
    expect(listRow(['a', 'b'])).toBe('a, b')
    expect(listRow([])).toBe('None')
    expect(listRow(['index, follow', 'noarchive'], 60, 0, '; ')).toBe('index, follow; noarchive')
  })

  it('cuts an overflowing first item without a double ellipsis or a sentence marker', () => {
    const long = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    const summary = listRow([long, 'noarchive'], 60, 0, '; ')
    expect(summary).toBe('index, follow, max-image-preview:large, max-snippet:… 1 more')
    expect(summary.length).toBeLessThanOrEqual(60)
    expect(summary).not.toContain('. ')
    expect(listRow([long])).toBe('index, follow, max-image-preview:large, max-snippet:-1, max…')
  })

  it('shows only short original markup in the overview, and never more than three fields', () => {
    const short = originalField('<meta name="a">', '<meta name="a">')
    const long = originalField('<script type="application/ld+json">', `<script>${'x'.repeat(600)}</script>`)
    expect(overviewMarkup([short, long])).toEqual([short])
    expect(overviewMarkup([short, short, short, short])).toEqual([])
  })
})
