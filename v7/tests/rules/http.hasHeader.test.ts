import { describe, it, expect } from 'vitest'
import { hasHeaderRule } from '@/rules/http/hasHeader'

const P = (h: Record<string,string>, vars: Record<string,string>) => ({ html:'', url:'', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: has header', () => {
  it('warns missing', async () => {
    const r = await hasHeaderRule.run(P({ 'x': '1' }, {}), { globals: { variables: { http_has_header: 'content-type, server' } } })
    expect((r as any).type).toBe('warn')
  })
  it('ok when present', async () => {
    const r = await hasHeaderRule.run(P({ 'content-type': 'text/html', 'server': 'x' }, {}), { globals: { variables: { http_has_header: 'content-type, server' } } })
    expect((r as any).type).toBe('ok')
  })
})

