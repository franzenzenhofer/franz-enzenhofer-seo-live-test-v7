import { describe, expect, it } from 'vitest'

import { PageInfo } from '@/shared/schemas'

describe('PageInfo schema', () => {
  it('parses valid data', () => {
    const v = PageInfo.parse({ url: 'https://a.com', title: '', description: '' })
    expect(v.url).toBe('https://a.com')
  })
})

