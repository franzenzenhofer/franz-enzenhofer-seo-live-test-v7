import { describe, it, expect } from 'vitest'
import { googlebotMetaRule } from '@/rules/head/googlebotMeta'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = (html: string) => googlebotMetaRule.run({ html: '', url: '', doc: D(html) } as any, { globals: {} })

describe('rule: meta googlebot', () => {
  it('reads content', async () => {
    const r = await run('<meta name="googlebot" content="noindex">')
    expect((r as any).message.includes('noindex')).toBe(true)
    expect((r as any).type).toBe('warn')
  })

  it('combines multiple googlebot meta tags instead of warning on multiplicity', async () => {
    const r = await run('<meta name="googlebot" content="nosnippet"><meta name="googlebot" content="notranslate">')
    expect((r as any).type).toBe('info')
    expect(((r as any).details as any).count).toBe(2)
  })

  it('surfaces noindex hidden in one of several googlebot meta tags', async () => {
    const r = await run('<meta name="googlebot" content="nosnippet"><meta name="googlebot" content="noindex">')
    expect((r as any).type).toBe('warn')
    expect(((r as any).details as any).hasNoindex).toBe(true)
  })
})
