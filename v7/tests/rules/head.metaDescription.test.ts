import { describe, it, expect } from 'vitest'

import { metaDescriptionRule } from '@/rules/head/metaDescription'

const D = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const run = (html: string) => metaDescriptionRule.run({ html, url: 'https://example.com', doc: D(html) } as any, { globals: {} })

describe('meta description rule', () => {
  it('reports missing meta description', async () => {
    const result = await run('<html><head></head><body></body></html>')
    expect(result.message).toBe('No meta description found.')
    expect(result.type).toBe('error')
  })

  it('warns when multiple descriptions exist', async () => {
    const html = '<meta name="description" content="First"><meta name="description" content="Second">'
    const result = await run(`<html><head>${html}</head><body></body></html>`)
    expect(result.type).toBe('error')
    expect(result.details?.domPaths).toEqual(['meta[name="description"]', 'meta[name="description"]:nth-of-type(2)'])
  })

  it('returns info when description present', async () => {
    const result = await run('<html><head><meta name="description" content="Hello world"></head></html>')
    expect(result.type).toBe('info')
    expect(result.details?.description).toBe('Hello world')
    expect(result.details?.domPath).toBe('meta[name="description"]')
  })
})
