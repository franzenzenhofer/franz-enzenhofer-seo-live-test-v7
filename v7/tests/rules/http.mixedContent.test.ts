import { describe, expect, it } from 'vitest'

import { mixedContentRule } from '@/rules/http/mixedContent'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const htmlDoc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const base = { html: '', doc: htmlDoc('<p/>') }
const ctx = { globals: {} }

describe('rule: http mixed content', () => {
  it('skips check on http pages', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'http://ex.com' }, ctx)
    expect(res.type).toBe('info')
    expect(res.priority).toBe(900)
    expect(res.presentation?.input).toBe('Page URL')
    expect(res.presentation?.values).toContainEqual({ key: 'Page protocol', value: 'HTTP', kind: 'text' })
  })

  it('passes when no mixed content', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'https://ex.com', doc: htmlDoc('<img src="https://ex.com/a.png">') }, ctx)
    expect(res.type).toBe('ok')
    expect(res.priority).toBe(850)
    expect(res.presentation?.values).toContainEqual({ key: 'Mixed-content resources', value: 0, kind: 'text' })
  })

  it('errors on mixed content resources', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'https://ex.com', doc: htmlDoc('<img src="http://cdn.ex/a.png"><script src="http://cdn.ex/app.js"></script>') }, ctx)
    expect(res.type).toBe('error')
    expect(res.priority).toBe(80)
    expect(res.presentation?.values).toContainEqual({ key: 'Mixed-content resources', value: 2, kind: 'text' })
  })

  it('errors on http:// stylesheet links (fetching link relation)', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'https://ex.com', doc: htmlDoc('<link rel="stylesheet" href="http://cdn.ex/a.css">') }, ctx)
    expect(res.type).toBe('error')
    expect(res.presentation?.values).toContainEqual({ key: 'Mixed-content resources', value: 1, kind: 'text' })
  })

  it('ignores non-fetching link relations like rel=canonical', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'https://ex.com', doc: htmlDoc('<link rel="canonical" href="http://ex.com/page"><link rel="alternate" hreflang="de" href="http://ex.com/de">') }, ctx)
    expect(res.type).toBe('ok')
  })

  it('warns on http:// form actions (W3C: MAY warn, not blockable mixed content)', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'https://ex.com', doc: htmlDoc('<form action="http://ex.com/submit"><input name="q"></form>') }, ctx)
    expect(res.type).toBe('warn')
    expect(res.priority).toBe(200)
    expect(res.presentation?.values).toContainEqual({ key: 'Insecure form actions', value: 1, kind: 'text' })
  })

  it('errors when network-captured resources are mixed content', async () => {
    const res = await mixedContentRule.run({ ...base, url: 'https://ex.com', resources: ['http://cdn.ex/a.js', 'https://ex.com/b.js'] }, ctx)
    expect(res.type).toBe('error')
    expect(res.presentation?.values).toContainEqual({ key: 'Mixed-content resources', value: 1, kind: 'text' })
    expect(res.presentation?.noMarkup).toContain('network-only')
  })

  it('copies references and labelled facts without legacy details', async () => {
    const result = enrichResult(
      await mixedContentRule.run({ ...base, url: 'https://ex.com', doc: htmlDoc('<img src="http://cdn.ex/a.png" alt="Logo">') }, ctx),
      mixedContentRule, 'test',
    )
    const copy = toResultCopyPayload(result)
    for (const value of ['http://cdn.ex/a.png', ...mixedContentRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
