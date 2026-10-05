import { describe, it, expect } from 'vitest'

import { xRobotsRule } from '@/rules/http/xRobots'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (h: Record<string, string>) => ({ html: '', url: '', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers: h })

describe('rule: http x-robots-tag', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await xRobotsRule.run(P({}), { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(50)
    expect(r.presentation?.input).toBe('Not captured')
  })

  it('reports present', async () => {
    const r = await xRobotsRule.run(P({ 'x-robots-tag': 'noindex' }), { globals: {} })
    expect(r.presentation?.values).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex', kind: 'text' })
  })

  it('warns when the header carries noindex', async () => {
    const r = await xRobotsRule.run(P({ 'x-robots-tag': 'noindex' }), { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(150)
    expect(r.presentation?.values).toContainEqual({ key: 'Applies to', value: 'all crawlers', kind: 'text' })
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Blocking', value: 'noindex', kind: 'text' })
  })

  it('warns when the header carries nofollow', async () => {
    const r = await xRobotsRule.run(P({ 'x-robots-tag': 'nofollow' }), { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Blocking', value: 'nofollow', kind: 'text' })
  })

  it('stays info for non-blocking directives', async () => {
    const r = await xRobotsRule.run(P({ 'x-robots-tag': 'noarchive' }), { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(750)
  })

  it('stays info without the header', async () => {
    const r = await xRobotsRule.run(P({ 'content-type': 'text/html' }), { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.values).toContainEqual({ key: 'X-Robots-Tag', value: 'Absent', kind: 'text' })
  })

  it('names the crawler and instruction per directive, and the header for multi-agent headers', async () => {
    const r = await xRobotsRule.run(P({ 'x-robots-tag': 'googlebot: noindex' }), { globals: {} })
    const record = r.presentation?.evidence[0]
    expect(record?.fields).toContainEqual({ key: 'Crawler', value: 'googlebot', kind: 'text' })
    expect(record?.fields).toContainEqual({ key: 'Instruction', value: 'noindex', kind: 'text' })
    expect(record?.name).toBe('X-Robots-Tag')
    expect(r.presentation?.values).toContainEqual({ key: 'Applies to', value: 'googlebot', kind: 'text' })
  })

  it('copies references and labelled facts without legacy details', async () => {
    const result = enrichResult(await xRobotsRule.run(P({ 'x-robots-tag': 'noindex' }), { globals: {} }), xRobotsRule, 'test')
    const copy = toResultCopyPayload(result)
    for (const value of ['noindex', ...xRobotsRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
