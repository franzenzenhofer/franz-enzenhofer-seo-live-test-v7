import { describe, expect, it } from 'vitest'

import { normalizeUrl } from '@/shared/url-utils'

describe('normalizeUrl', () => {
  it('keeps the query string - ?a=1 and ?a=2 are different pages', () => {
    expect(normalizeUrl('https://ex.com/p?a=1')).not.toBe(normalizeUrl('https://ex.com/p?a=2'))
    expect(normalizeUrl('https://ex.com/p?a=1')).toContain('a=1')
  })

  it('still drops the fragment', () => {
    expect(normalizeUrl('https://ex.com/p#frag')).toBe(normalizeUrl('https://ex.com/p'))
  })

  it('still folds index.html, trailing slash and hostname case', () => {
    expect(normalizeUrl('https://EX.com/dir/index.html')).toBe(normalizeUrl('https://ex.com/dir'))
  })
})
