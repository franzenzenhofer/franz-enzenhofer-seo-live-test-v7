import { describe, it, expect } from 'vitest'

import { toHtmlAnchored } from '@/cli/report'

describe('cli/report: toHtmlAnchored', () => {
  it('renders anchors and summary correctly', () => {
    const rows = [
      { label: 'HEAD', message: 'ok', type: 'ok' },
      { label: 'HTTP', message: 'warn', type: 'warn' },
      { label: 'META', message: 'err', type: 'error' },
      { label: 'INFO', message: 'info', type: 'info' },
    ]
    const html = toHtmlAnchored('https://example.com', rows)
    expect(html).toContain('id="r-i-0"')
    expect(html).toContain('id="r-i-3"')
    expect(html).toContain('ok 1')
    expect(html).toContain('warn 1')
    expect(html).toContain('error 1')
    expect(html).toContain('info 1')
  })
})

