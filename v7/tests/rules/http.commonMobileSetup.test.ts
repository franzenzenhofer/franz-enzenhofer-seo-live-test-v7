import { describe, it, expect } from 'vitest'
import { commonMobileSetupRule } from '@/rules/http/commonMobileSetup'

const P = (html: string, headers: Record<string,string> = {}) =>
  ({ html, url: 'https://ex.com/', doc: new DOMParser().parseFromString(html, 'text/html'), headers })

describe('rule: common mobile setup', () => {
  it('runs without captured headers (pure DOM check)', async () => {
    const r = await commonMobileSetupRule.run(P('<html><head></head><body></body></html>') as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('warns when meta viewport is missing, citing responsive-design guidance', async () => {
    const r = await commonMobileSetupRule.run(P('<html><head><title>t</title></head></html>') as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).not.toContain('mobile-first indexing')
    expect((r as any).details.reference).toBe('https://web.dev/articles/responsive-web-design-basics')
  })
  it('is ok with viewport present even without apple-touch-icon', async () => {
    const r = await commonMobileSetupRule.run(
      P('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head></html>') as any,
      { globals: {} },
    )
    expect((r as any).type).toBe('ok')
    expect((r as any).details.hasTouchIcon).toBe(false)
    expect((r as any).details.viewportContent).toContain('width=device-width')
  })
  it('reports apple-touch-icon presence as detail', async () => {
    const r = await commonMobileSetupRule.run(
      P('<html><head><meta name="viewport" content="width=device-width"><link rel="apple-touch-icon" href="/i.png"></head></html>') as any,
      { globals: {} },
    )
    expect((r as any).type).toBe('ok')
    expect((r as any).details.hasTouchIcon).toBe(true)
  })
})
