import { describe, it, expect } from 'vitest'
import { unavailableAfterRule } from '@/rules/http/unavailableAfter'

const P = (h: Record<string, string>) =>
  ({ html: '', url: '', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers: h })

const run = (headers: Record<string, string>) => unavailableAfterRule.run(P(headers) as any, { globals: {} })

describe('rule: http unavailable_after', () => {
  it('reports missing header as info', async () => {
    const r = await run({ 'content-type': 'text/html' })
    expect((r as any).type).toBe('info')
  })

  it('ok when header has no unavailable_after directive', async () => {
    const r = await run({ 'x-robots-tag': 'noindex, nofollow' })
    expect((r as any).type).toBe('ok')
  })

  it('captures the full RFC 822 date, not just the first token', async () => {
    const r = await run({ 'x-robots-tag': 'unavailable_after: 25 Jun 2049 15:00:00 GMT' })
    expect((r as any).type).toBe('warn')
    expect(((r as any).details as any).dateValue).toBe('25 Jun 2049 15:00:00 GMT')
  })

  it('errors when the removal date is already in the past', async () => {
    const r = await run({ 'x-robots-tag': 'unavailable_after: 25 Jun 2010 15:00:00 GMT' })
    expect((r as any).type).toBe('error')
    expect(((r as any).details as any).past).toBe(true)
  })

  it('detects the directive after other rules in the header', async () => {
    const r = await run({ 'x-robots-tag': 'noindex, unavailable_after: 25 Jun 2010 15:00:00 GMT' })
    expect((r as any).type).toBe('error')
  })

  it('warns without asserting removal when the date is unparseable', async () => {
    const r = await run({ 'x-robots-tag': 'unavailable_after: not-a-date' })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toMatch(/ignores the rule/)
  })
})
