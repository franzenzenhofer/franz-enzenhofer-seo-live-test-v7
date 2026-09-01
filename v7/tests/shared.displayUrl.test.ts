import { describe, expect, it } from 'vitest'

import { displayUrl } from '@/shared/displayUrl'

describe('displayUrl', () => {
  it('leaves a short URL intact, minus the scheme', () => {
    expect(displayUrl('https://schema.org/Article')).toEqual({ domain: 'schema.org', display: 'schema.org/Article' })
  })

  it('keeps the domain and the cited section of a long URL, cutting the middle', () => {
    const url = 'https://developers.google.com/search/docs/crawling-indexing/supported-tags#meta-descriptions'
    expect(displayUrl(url)).toEqual({
      domain: 'developers.google.com',
      display: 'developers.google.com/…/supported-tags#meta-descriptions',
    })
  })

  it('handles a URL with no path', () => {
    expect(displayUrl('https://example.com/')).toEqual({ domain: 'example.com', display: 'example.com' })
  })

  it('passes a non-http value through unchanged', () => {
    expect(displayUrl('not a url at all')).toEqual({ domain: '', display: 'not a url at all' })
    expect(displayUrl('mailto:x@example.com')).toEqual({ domain: '', display: 'mailto:x@example.com' })
  })
})
