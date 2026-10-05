import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { linkPreloadRule } from '@/rules/speed/linkPreload'
import { blockingScriptsRule } from '@/rules/speed/blockingScripts'
import { presentationSchema } from '@/shared/presentation/schema'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const runPreload = async (doc: Document) => enrichResult(await linkPreloadRule.run({ html: '', url: 'https://ex.com', doc } as never, { globals: {} }), linkPreloadRule, 'test')
const runBlocking = async (doc: Document) => enrichResult(await blockingScriptsRule.run({ html: '', url: 'https://ex.com', doc } as never, { globals: {} }), blockingScriptsRule, 'test')
const value = (result: Awaited<ReturnType<typeof runPreload>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('rule: speed link preload', () => {
  it('reports preload links with a resolving href as a clickable evidence field', async () => {
    const result = await runPreload(D('<head><link rel="preload" as="script" href="/a.js"></head>'))
    expect(result.type).toBe('info'); expect(result.priority).toBe(750)
    expect(result.presentation?.values).toEqual([{ key: '<link rel="preload">', value: '<link rel="preload" as="script" href="/a.js">', kind: 'original', fidelity: 'complete-original' }])
    expect(result.presentation?.input).toBe('Static DOM')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'href')).toEqual({ key: 'href', value: '/a.js', kind: 'url' })
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'as')?.value).toBe('script')
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('reports a non-resolving href as plain text, never a false link', async () => {
    const result = await runPreload(D('<head><link rel="preload" href="javascript:alert(1)"></head>'))
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'href')).toEqual({ key: 'href', value: 'javascript:alert(1)', kind: 'text' })
  })

  it('states which preload markup was not retained', async () => {
    const result = await runPreload(D(`<head><link rel="preload" href="/small.js"><link rel="preload" href="/${'x'.repeat(2000)}.js"></head>`))
    expect(result.presentation?.markup).toHaveLength(1)
    expect(value(result, 'Preload links')).toBe(2)
    expect(result.presentation?.evidence[1]?.fields).toContainEqual({ key: 'Markup', value: 'Not captured', kind: 'text' })
    expect(result.presentation?.detailValues).toContainEqual({ key: 'Markup omitted', value: 1, kind: 'text' })
  })

  it('reports no preload links as informational with the lowest of the two priorities', async () => {
    const result = await runPreload(D('<head></head>'))
    expect(result.priority).toBe(900); expect(value(result, 'Preload links')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
  })
})

describe('rule: speed blocking scripts', () => {
  it('warns on a classic synchronous external script in head', async () => {
    const result = await runBlocking(D('<head><script src="/b.js"></script></head>'))
    expect(result.type).toBe('warn'); expect(result.priority).toBe(250)
    expect(result.presentation?.values).toEqual([{ key: '<script>', value: '<script src="/b.js"></script>', kind: 'original', fidelity: 'complete-original' }])
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'src')).toEqual({ key: 'src', value: '/b.js', kind: 'url' })
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('does not flag module scripts', async () => {
    const result = await runBlocking(D('<head><script type="module" src="/m.js"></script></head>'))
    expect(result.type).toBe('ok'); expect(result.priority).toBe(850); expect(value(result, 'Blocking scripts')).toBe(0)
  })

  it('does not flag non-JavaScript script types', async () => {
    const result = await runBlocking(D('<head><script type="text/template" src="/t.tpl"></script></head>'))
    expect(result.type).toBe('ok')
  })

  it('still flags explicit JavaScript MIME types', async () => {
    const result = await runBlocking(D('<head><script type="text/javascript" src="/c.js"></script></head>'))
    expect(result.type).toBe('warn')
  })

  it('distinguishes an empty type attribute from an absent one', async () => {
    const result = await runBlocking(D('<head><script type="" src="/e.js"></script><script src="/f.js"></script></head>'))
    expect(result.type).toBe('warn'); expect(value(result, 'Blocking scripts')).toBe(2)
    const types = result.presentation?.evidence.map((record) => record.fields.find((field) => field.key === 'type')?.value)
    expect(types).toEqual(['Empty', 'Absent'])
  })
})
