import { describe, it, expect } from 'vitest'

import { titleRule } from '@/rules/head/title'

const run = (html: string) => titleRule.run({ html, url: 'https://example.com', doc: new DOMParser().parseFromString(html, 'text/html') } as any, { globals: {} })

describe('title rule', () => {
  it('detects missing title', async () => {
    const result = await run('<html><head></head></html>')
    expect(result.type).toBe('error')
  })

  it('flags too short title', async () => {
    const result = await run('<html><head><title>Short</title></head></html>')
    expect(result.message).toContain('Title too short')
    expect(result.type).toBe('warn')
  })

  it('flags too long title', async () => {
    const title = 'T'.repeat(80)
    const result = await run(`<html><head><title>${title}</title></head></html>`)
    expect(result.message).toContain('Title too long')
    expect(result.type).toBe('warn')
  })

  it('passes acceptable length', async () => {
    const title = 'This is a reasonably sized title'
    const result = await run(`<html><head><title>${title}</title></head></html>`)
    expect(result.type).toBe('ok')
  })
})
