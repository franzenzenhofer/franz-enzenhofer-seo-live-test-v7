import { describe, it, expect } from 'vitest'

import { titleRule } from '@/rules/head/title'

const run = (html: string) => titleRule.run({ html, url: 'https://example.com', doc: new DOMParser().parseFromString(html, 'text/html') } as any, { globals: {} })

describe('title rule', () => {
  it('detects missing title', async () => {
    const result = await run('<html><head></head></html>')
    expect(result.type).toBe('error')
    expect(result.message).toContain('Missing <title> tag')
  })

  it('detects empty title', async () => {
    const result = await run('<html><head><title></title></head></html>')
    expect(result.type).toBe('error')
    expect(result.message).toContain('empty')
  })

  it('detects multiple title tags', async () => {
    const result = await run('<html><head><title>First</title><title>Second</title></head></html>')
    expect(result.type).toBe('error')
    expect(result.message).toContain('2 <title> tags found')
  })

  it('passes single non-empty title', async () => {
    const result = await run('<html><head><title>Valid Title</title></head></html>')
    expect(result.type).toBe('ok')
    expect(result.message).toContain('1 <title> tag found')
  })
})
