import { describe, it, expect } from 'vitest'
import { hstsRule } from '@/rules/http/hsts'

const P = (h: Record<string,string>, url = 'https://ex.com/') => ({ html:'', url, doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: http hsts', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await hstsRule.run(P({}), { globals: {} })
    expect((r as any).type).toBe('runtime_error')
    expect((r as any).message).toContain('Hard Reload')
  })
  it('warns on missing HSTS on HTTPS pages', async () => {
    const r = await hstsRule.run(P({ 'content-type': 'text/html' }), { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('reports info (not warn) on missing HSTS over HTTP', async () => {
    const r = await hstsRule.run(P({ 'content-type': 'text/html' }, 'http://ex.com/'), { globals: {} })
    expect((r as any).type).toBe('info')
  })
  it('ok on present', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'max-age=31536000' }), { globals: {} })
    expect((r as any).type).toBe('ok')
    expect((r as any).details.maxAge).toBe(31536000)
  })
  it('parses directives case-insensitively per RFC 6797', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'Max-Age=31536000; IncludeSubDomains' }), { globals: {} })
    expect((r as any).details.maxAge).toBe(31536000)
    expect((r as any).details.includeSubDomains).toBe(true)
  })
  it('parses quoted max-age values', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'max-age="31536000"' }), { globals: {} })
    expect((r as any).details.maxAge).toBe(31536000)
  })
  it('warns on max-age=0 (policy removal)', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'max-age=0' }), { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('max-age=0')
  })
  it('notes unmet preload requirements', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'max-age=300; preload' }), { globals: {} })
    expect((r as any).type).toBe('ok')
    expect((r as any).message).toContain('preload requires')
  })
})
