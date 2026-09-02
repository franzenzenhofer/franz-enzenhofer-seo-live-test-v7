import { describe, it, expect } from 'vitest'

import { metaDescriptionRule } from '@/rules/head/metaDescription'

const D = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const run = (html: string) => metaDescriptionRule.run({ html, url: 'https://example.com', doc: D(html) } as any, { globals: {} })

describe('meta description rule', () => {
  it('warns on missing meta description (Google auto-generates snippets)', async () => {
    const result = await run('<html><head></head><body></body></html>')
    expect(result.message).toBe('No meta description found.')
    expect(result.type).toBe('warn')
  })

  it('errors when multiple descriptions exist', async () => {
    const html = '<meta name="description" content="First"><meta name="description" content="Second">'
    const result = await run(`<html><head>${html}</head><body></body></html>`)
    expect(result.type).toBe('error')
    expect(result.details?.domPaths).toEqual(['html > head > meta:nth-of-type(1)', 'html > head > meta:nth-of-type(2)'])
  })

  it('warns on empty meta description', async () => {
    const result = await run('<html><head><meta name="description" content="  "></head></html>')
    expect(result.message).toBe('Meta description is empty.')
    expect(result.type).toBe('warn')
  })

  it('passes when description present, showing length and value', async () => {
    const result = await run('<html><head><meta name="description" content="Hello world"></head></html>')
    expect(result.type).toBe('ok')
    expect(result.message).toContain('11 characters')
    expect(result.details?.description).toBe('Hello world')
    expect(result.details?.domPath).toBe('html > head > meta')
  })
})
