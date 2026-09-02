import { describe, it, expect } from 'vitest'
import { metaCharsetRule } from '@/rules/head/metaCharset'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('rule: meta charset', () => {
  it('accepts utf-8 meta charset as ok', async () => {
    const r = await metaCharsetRule.run({ html:'', url:'', doc: D('<meta charset="utf-8">') } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
    expect((r as any).message.includes('UTF-8')).toBe(true)
  })
  it('warns on non-UTF-8 charset (WHATWG requires utf-8)', async () => {
    const r = await metaCharsetRule.run({ html:'', url:'', doc: D('<meta charset="ISO-8859-1">') } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('ISO-8859-1')
  })
  it('warns on empty meta charset value', async () => {
    const r = await metaCharsetRule.run({ html:'', url:'', doc: D('<meta charset="">') } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('accepts utf-8 declared via meta http-equiv Content-Type', async () => {
    const r = await metaCharsetRule.run({ html:'', url:'', doc: D('<meta http-equiv="Content-Type" content="text/html; charset=utf-8">') } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
    expect((r as any).details.charsetSource).toBe('http-equiv')
  })
  it('accepts utf-8 declared via Content-Type response header', async () => {
    const page = { html:'', url:'', doc: D('<p>x</p>'), headers: { 'content-type': 'text/html; charset=UTF-8' } }
    const r = await metaCharsetRule.run(page as any, { globals: {} })
    expect((r as any).type).toBe('ok')
    expect((r as any).details.charsetSource).toBe('header')
  })
  it('warns when no encoding declaration is found anywhere', async () => {
    const r = await metaCharsetRule.run({ html:'', url:'', doc: D('<p>x</p>') } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})
