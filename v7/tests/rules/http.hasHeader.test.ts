import { describe, it, expect } from 'vitest'

import { hasHeaderRule } from '@/rules/http/hasHeader'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (h: Record<string, string>) => ({ html: '', url: '', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers: h })
const run = (h: Record<string, string>, config: string) => hasHeaderRule.run(P(h), { globals: { variables: { http_has_header: config } } })

describe('rule: has header', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await hasHeaderRule.run(P({}), { globals: { variables: { http_has_header: 'server' } } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(50)
    expect(r.presentation?.input).toBe('Not captured')
  })

  it('reports info when nothing is configured', async () => {
    const r = await run({ 'content-type': 'text/html' }, '')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.values).toContainEqual({ key: 'Configured headers', value: 'None', kind: 'text' })
  })

  it('warns when all configured headers are missing', async () => {
    const r = await run({ x: '1' }, 'content-type, server')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(200)
    expect(r.presentation?.values).toContainEqual({ key: 'Missing count', value: 2, kind: 'text' })
  })

  it('warns when some configured headers are missing', async () => {
    const r = await run({ 'content-type': 'text/html' }, 'content-type, server')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(300)
    expect(r.presentation?.values).toContainEqual({ key: 'Present count', value: 1, kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Missing count', value: 1, kind: 'text' })
  })

  it('ok when all configured headers are present', async () => {
    const r = await run({ 'content-type': 'text/html', server: 'x' }, 'content-type, server')
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(750)
    expect(r.presentation?.values).toContainEqual({ key: 'All present', value: 'Yes', kind: 'text' })
  })

  it('names each configured header in checked', async () => {
    const r = await run({ 'content-type': 'text/html', server: 'x' }, 'content-type, server')
    expect(r.presentation?.checked).toContainEqual({ key: 'Configured headers', value: 'content-type, server', kind: 'text' })
    expect(r.presentation?.evidence.map((e) => e.name)).toEqual(['content-type', 'server'])
  })

  it('copies references (fallback) and labelled facts without legacy details', async () => {
    const result = enrichResult(await run({ 'content-type': 'text/html', server: 'x' }, 'content-type, server'), hasHeaderRule, 'test')
    const copy = toResultCopyPayload(result)
    expect(copy).toContain('https://fullstackoptimization.com/')
    expect(result.details).toBeUndefined()
  })
})
