import { describe, expect, it } from 'vitest'

import { mixedContentRule } from '@/rules/http/mixedContent'

const htmlDoc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const base = { html: '', doc: htmlDoc('<p/>') }
const ctx = { globals: {} }

describe('rule: http mixed content', () => {
  it('skips check on http pages', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'http://ex.com' } as any, ctx as any)
    expect(res.type).toBe('info')
    expect(res.message).toContain('skipped')
  })

  it('passes when no mixed content', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'https://ex.com', doc: htmlDoc('<img src="https://ex.com/a.png">') } as any, ctx as any)
    expect(res.type).toBe('ok')
  })

  it('errors on mixed content resources', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'https://ex.com', doc: htmlDoc('<img src="http://cdn.ex/a.png"><script src="http://cdn.ex/app.js"></script>') } as any, ctx as any)
    expect(res.type).toBe('error')
    expect(res.message).toContain('mixed-content')
    expect((res.details as any).count).toBe(2)
  })

  it('errors on http:// stylesheet links (fetching link relation)', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'https://ex.com', doc: htmlDoc('<link rel="stylesheet" href="http://cdn.ex/a.css">') } as any, ctx as any)
    expect(res.type).toBe('error')
    expect((res.details as any).count).toBe(1)
  })

  it('ignores non-fetching link relations like rel=canonical', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'https://ex.com', doc: htmlDoc('<link rel="canonical" href="http://ex.com/page"><link rel="alternate" hreflang="de" href="http://ex.com/de">') } as any, ctx as any)
    expect(res.type).toBe('ok')
  })

  it('warns on http:// form actions (W3C: MAY warn, not blockable mixed content)', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'https://ex.com', doc: htmlDoc('<form action="http://ex.com/submit"><input name="q"></form>') } as any, ctx as any)
    expect(res.type).toBe('warn')
    expect(res.message).toContain('form')
    expect((res.details as any).count).toBe(1)
  })

  it('errors when network-captured resources are mixed content', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'https://ex.com', resources: ['http://cdn.ex/a.js', 'https://ex.com/b.js'] } as any, ctx as any)
    expect(res.type).toBe('error')
    expect((res.details as any).count || (res.details as any).networkCount).toBeGreaterThan(0)
  })
})
