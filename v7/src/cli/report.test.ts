import { describe, it, expect } from 'vitest'

import { toHtml } from './report'

describe('report', () => {
  it('renders simple HTML', () => {
    const html = toHtml('https://example.com', [{ label: 'HEAD', message: 'OK', type: 'ok' }])
    expect(html.includes('Live Test Report')).toBe(true)
    expect(html.includes('https://example.com')).toBe(true)
    expect(html.includes('HEAD')).toBe(true)
  })
})
