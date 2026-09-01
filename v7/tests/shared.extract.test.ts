import { describe, expect, it } from 'vitest'

import { extractPageInfo } from '@/shared/extract'

describe('extractPageInfo', () => {
  it('returns basic metadata', () => {
    document.title = 'Hello'
    const m = document.createElement('meta')
    m.setAttribute('name', 'description')
    m.setAttribute('content', 'World')
    document.head.appendChild(m)
    const link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    link.setAttribute('href', 'https://ex.com/')
    document.head.appendChild(link)
    const r = extractPageInfo()
    expect(r.title).toBe('Hello')
    expect(r.description).toBe('World')
    expect(r.canonical).toBe('https://ex.com/')
  })

  it('finds the canonical like the rules do: any-case, multi-token rel', () => {
    document.querySelectorAll('link').forEach((el) => el.remove())
    const link = document.createElement('link')
    link.setAttribute('rel', 'Canonical preload')
    link.setAttribute('href', 'https://ex.com/case')
    document.head.appendChild(link)
    expect(extractPageInfo().canonical).toBe('https://ex.com/case')
  })
})

