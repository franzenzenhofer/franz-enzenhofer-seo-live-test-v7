import { describe, it, expect } from 'vitest'

import { resultPreview } from '@/shared/resultPreview'

describe('resultPreview', () => {
  it('shows the title behind "Title set."', () => {
    expect(resultPreview({ title: 'Stocker mit Plan', snippet: '<title>Stocker mit Plan</title>' }))
      .toBe('Stocker mit Plan')
  })

  it('shows the heading text behind "1 <h1> found."', () => {
    // Only markup is available; the text inside it is what a human reads.
    expect(resultPreview({ sourceHtml: '<h1 class="lead">Stocker mit Plan für „Zukunftsdepot“</h1>' }))
      .toBe('Stocker mit Plan für „Zukunftsdepot“')
  })

  it('shows the canonical URL, which lives in an attribute not in text', () => {
    expect(resultPreview({ snippet: '<link rel="canonical" href="https://orf.at/stories/3440788/">' }))
      .toBe('https://orf.at/stories/3440788/')
  })

  it('recovers a value from a snippet capped mid-attribute', () => {
    expect(resultPreview({ snippet: '<link rel="preload" href="//orf.at/fonts/ORFUniversalVF_W_' }))
      .toBe('//orf.at/fonts/ORFUniversalVF_W_')
  })

  it('summarises a list of directives', () => {
    const directives = [
      { ua: 'robots', value: 'index, follow' },
      { ua: 'googlebot', value: 'max-snippet:-1' },
    ]
    expect(resultPreview({ directives })).toBe('robots: index, follow · googlebot: max-snippet:-1')
  })

  it('summarises a record, so "HTTP headers captured." shows the headers', () => {
    const out = resultPreview({ httpHeaders: { 'cache-control': 'max-age=0', server: 'nginx' }, status: 200 })
    expect(out).toContain('cache-control: max-age=0')
    expect(out).toContain('server: nginx')
  })

  it('never shows spec links or DOM paths as the value', () => {
    expect(resultPreview({ reference: 'https://developers.google.com/x', domPath: 'html > head' })).toBe('')
  })

  it('returns nothing when the rule found nothing', () => {
    expect(resultPreview({})).toBe('')
    expect(resultPreview(undefined)).toBe('')
  })

  it('truncates very long values', () => {
    const out = resultPreview({ description: 'x'.repeat(500) })
    expect(out.length).toBeLessThanOrEqual(160)
    expect(out.endsWith('…')).toBe(true)
  })
})
