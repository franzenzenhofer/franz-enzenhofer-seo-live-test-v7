import { describe, it, expect } from 'vitest'

import { capHtmlForMessage, capHtmlForMessageAsync, HTML_CAP_BYTES } from '@/shared/htmlCap'

const RUNTIME_MESSAGE_BUDGET = 32 * 1024 // hardening plan section 1: messages must stay under 32 KB

describe('htmlCap', () => {
  it('passes through small HTML unchanged', () => {
    const html = '<html><body>hello</body></html>'
    const capped = capHtmlForMessage(html)
    expect(capped.truncated).toBe(false)
    expect(capped.payload).toBe(html)
    expect(capped.size).toBe(new TextEncoder().encode(html).length)
  })

  it('drops the payload when over the cap', () => {
    const big = 'x'.repeat(HTML_CAP_BYTES + 1024)
    const capped = capHtmlForMessage(big)
    expect(capped.truncated).toBe(true)
    expect(capped.payload).toBe('')
    expect(capped.size).toBe(big.length)
    expect(capped.snippet).toContain('[truncated')
  })

  it('JSON-encoded message stays under the 32 KB chrome.runtime budget for a 5 MB page', async () => {
    const big = 'a'.repeat(5 * 1024 * 1024)
    const capped = await capHtmlForMessageAsync(big)
    expect(capped.truncated).toBe(true)
    const wireMessage = JSON.stringify({ event: 'load', data: { html: capped.payload, htmlSha256: capped.sha256, htmlSize: capped.size, truncated: capped.truncated } })
    expect(new TextEncoder().encode(wireMessage).length).toBeLessThan(RUNTIME_MESSAGE_BUDGET)
  })

  it('fills sha256 when truncated', async () => {
    const big = 'b'.repeat(HTML_CAP_BYTES + 100)
    const capped = await capHtmlForMessageAsync(big)
    expect(capped.sha256).toMatch(/^[0-9a-f]{64}$/)
  })
})
