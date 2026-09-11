import { describe, it, expect } from 'vitest'
import { twitterCardRule } from '@/rules/head/twitterCard'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = (html: string) => twitterCardRule.run({ html: '', url: 'https://example.test/', doc: D(html) }, { globals: {} })

describe('rule: twitter card', () => {
  it('reports absence as information', async () => {
    const r = await run('<head></head>')
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(r.presentation?.values).toContainEqual({ key: 'twitter:card', value: 'Not found', kind: 'text' })
    expect(r.presentation?.noMarkup).toBe('No matching twitter:card meta element found')
    expect(r.label).toBe('HEAD')
  })

  it('warns when the tag is present but empty', async () => {
    const html = '<meta name="twitter:card" content="">'
    const r = await run(html)
    expect(r.type).toBe('warn'); expect(r.priority).toBe(500)
    expect(r.presentation?.values).toContainEqual({ key: 'twitter:card', value: 'Empty', kind: 'text' })
    expect(r.presentation?.markup[0]?.value).toBe(html)
  })

  it('passes a valid card type and reports it as a value', async () => {
    const html = '<meta name="twitter:card" content="summary_large_image">'
    const r = await run(html)
    expect(r.type).toBe('ok'); expect(r.priority).toBe(750)
    expect(r.presentation?.values).toContainEqual({ key: 'twitter:card', value: 'summary_large_image', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Card type valid', value: 'Yes', kind: 'text' })
    expect(r.presentation?.markup[0]?.value).toBe(html)
    expect(toResultCopyPayload(r)).toContain(twitterCardRule.meta.references[0])
    expect(r.details).toBeUndefined()
  })

  it('warns on an unsupported card type while still reporting the declared value', async () => {
    const html = '<meta name="twitter:card" content="unsupported-type">'
    const r = await run(html)
    expect(r.type).toBe('warn'); expect(r.priority).toBe(400)
    expect(r.presentation?.values).toContainEqual({ key: 'twitter:card', value: 'unsupported-type', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Card type valid', value: 'No', kind: 'text' })
    expect(r.presentation?.checked).toContainEqual({ key: 'Valid card types', value: 'summary, summary_large_image, app, player', kind: 'text' })
  })
})
