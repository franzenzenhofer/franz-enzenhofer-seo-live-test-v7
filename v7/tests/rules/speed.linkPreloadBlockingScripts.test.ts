import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { linkPreloadRule } from '@/rules/speed/linkPreload'
import { blockingScriptsRule } from '@/rules/speed/blockingScripts'
import { presentationSchema } from '@/shared/presentation/schema'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const runPreload = async (doc: Document) => enrichResult(await linkPreloadRule.run({ html: '', url: 'https://ex.com', doc } as never, { globals: {} }), linkPreloadRule, 'test')
const value = (result: Awaited<ReturnType<typeof runPreload>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('rule: speed link preload', () => {
  it('reports preload links with a resolving href as a clickable evidence field', async () => {
    const result = await runPreload(D('<head><link rel="preload" as="script" href="/a.js"></head>'))
    expect(result.type).toBe('info'); expect(result.priority).toBe(750); expect(value(result, 'Preload links')).toBe(1)
    expect(result.presentation?.input).toBe('Static DOM')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Href')).toEqual({ key: 'Href', value: '/a.js', kind: 'url' })
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('reports a non-resolving href as plain text, never a false link', async () => {
    const result = await runPreload(D('<head><link rel="preload" href="javascript:alert(1)"></head>'))
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Href')).toEqual({ key: 'Href', value: 'javascript:alert(1)', kind: 'text' })
  })

  it('states which preload markup was not retained', async () => {
    const result = await runPreload(D(`<head><link rel="preload" href="/small.js"><link rel="preload" href="/${'x'.repeat(2000)}.js"></head>`))
    expect(result.presentation?.markup).toHaveLength(1)
    expect(result.presentation?.evidence.find((record) => record.name === 'Capture status')?.fields)
      .toEqual([{ key: 'Preload link markup 2', value: 'Complete original markup not retained', kind: 'text' }])
  })

  it('reports no preload links as informational with the lowest of the two priorities', async () => {
    const result = await runPreload(D('<head></head>'))
    expect(result.priority).toBe(900); expect(value(result, 'Preload links')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
  })
})

describe('rules: speed (not yet migrated)', () => {
  it('reports preload and blocking scripts', async () => {
    const doc = D('<head><link rel="preload" as="script" href="/a.js"><script src="/b.js"></script></head>')
    const p = { html:'', url:'https://ex.com', doc }
    const r2 = await blockingScriptsRule.run(p as any, { globals: {} })
    expect((r2 as any).type).toBe('warn')
  })

  it('does not flag module scripts', async () => {
    const doc = D('<head><script type="module" src="/m.js"></script></head>')
    const p = { html:'', url:'https://ex.com', doc }
    const r = await blockingScriptsRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('does not flag non-JavaScript script types', async () => {
    const doc = D('<head><script type="text/template" src="/t.tpl"></script></head>')
    const p = { html:'', url:'https://ex.com', doc }
    const r = await blockingScriptsRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('still flags explicit JavaScript MIME types', async () => {
    const doc = D('<head><script type="text/javascript" src="/c.js"></script></head>')
    const p = { html:'', url:'https://ex.com', doc }
    const r = await blockingScriptsRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})
