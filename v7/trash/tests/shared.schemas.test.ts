// Moved to trash on 2025-11-26: PageInfo schema removed with page-info messaging path.
import { describe, expect, it } from 'vitest'

import { PageInfo } from '@/shared/schemas'

describe('PageInfo schema', () => {
  it('parses valid data', () => {
    const v = PageInfo.parse({ url: 'https://a.com', title: '', description: '' })
    expect(v.url).toBe('https://a.com')
  })
})
