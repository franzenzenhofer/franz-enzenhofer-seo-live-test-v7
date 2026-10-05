import { describe, expect, it } from 'vitest'

import { robotsMetaRule as rule } from '@/rules/head/robotsMeta'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(
  await rule.run({ html, url: 'https://ex.com', doc: doc(html) }, { globals: {} }), rule, 'test',
)

describe('rule: robots meta', () => {
  it('reports absence as info', async () => {
    const r = await run('<html><head></head></html>')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(700)
    expect(r.presentation?.values).toEqual([{ key: 'Robots meta', value: 'Not found', kind: 'text' }])
  })

  it('reports a single harmless tag as info and retains its complete original markup', async () => {
    const html = '<meta name="robots" content="index,follow">'
    const r = await run(html)
    expect(r.type).toBe('info')
    expect(r.priority).toBe(700)
    expect(r.presentation?.markup[0]?.value).toBe(html)
    expect(r.presentation?.values.map(({ key, value }) => `${key}: ${value}`)).toEqual([
      'Instruction: index, follow', 'Applies to: all crawlers', `<meta name="robots">: ${html}`])
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Instruction', value: 'index,follow', kind: 'text' })
  })

  it('warns on noindex in a single tag', async () => {
    const r = await run('<meta name="robots" content="noindex">')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(150)
    expect(r.presentation?.values).toContainEqual({ key: 'Instruction', value: 'noindex', kind: 'text' })
  })

  it('warns on nofollow alone for this rule (unlike head:robots-noindex)', async () => {
    const r = await run('<meta name="robots" content="nofollow">')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(150)
    expect(r.presentation?.values).toContainEqual({ key: 'Instruction', value: 'nofollow', kind: 'text' })
  })

  it('combines multiple robots meta tags instead of warning on multiplicity', async () => {
    const r = await run('<meta name="robots" content="max-image-preview:large"><meta name="robots" content="notranslate">')
    expect(r.type).toBe('info')
    expect(r.presentation?.values).toContainEqual({ key: 'robots meta tags', value: 2, kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Instructions', value: 'max-image-preview:large, notranslate', kind: 'text' })
    expect(r.presentation?.values.filter(({ kind }) => kind === 'original')).toHaveLength(2)
  })

  it('surfaces noindex hidden in one of several robots meta tags', async () => {
    const r = await run('<meta name="robots" content="noindex"><meta name="robots" content="nofollow">')
    expect(r.type).toBe('warn')
    expect(r.presentation?.values).toContainEqual({ key: 'robots meta tags', value: 2, kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Instructions', value: 'noindex, nofollow', kind: 'text' })
    expect(r.presentation?.evidence.map(({ name }) => name)).toEqual(['<meta name="robots"> 1', '<meta name="robots"> 2'])
  })

  it('reads generic restrictions declared outside the head', async () => {
    const r = await run('<body><meta name="ROBOTS" content="noindex"></body>')
    expect(r.type).toBe('warn')
    expect(r.presentation?.values).toContainEqual({ key: 'Instruction', value: 'noindex', kind: 'text' })
    expect(r.presentation?.markup).toHaveLength(1)
  })

  it('preserves the documentation reference, userGuide, and removes the legacy details payload', async () => {
    const r = await run('<meta name="robots" content="index">')
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(rule.meta.userGuide?.check).toContain('robots meta tags')
    expect(r.details).toBeUndefined()
    expect(toResultCopyPayload(r)).not.toContain('[object Object]')
  })
})
