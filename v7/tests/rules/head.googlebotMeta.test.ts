import { describe, expect, it } from 'vitest'

import { googlebotMetaRule as rule } from '@/rules/head/googlebotMeta'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(
  await rule.run({ html: '', url: 'https://ex.com', doc: doc(html) }, { globals: {} }), rule, 'test',
)

describe('rule: meta googlebot', () => {
  it('reads content and warns on noindex', async () => {
    const html = '<meta name="googlebot" content="noindex">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.presentation?.evidence[0]?.name).toBe('<meta name="googlebot">')
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Instruction', value: 'noindex', kind: 'text' })
    expect(r.presentation?.markup[0]?.value).toBe(html)
    expect(r.presentation?.values).toContainEqual({ key: '<meta name="googlebot">', value: html, kind: 'original', fidelity: 'complete-original' })
  })

  it('combines multiple googlebot meta tags instead of warning on multiplicity', async () => {
    const r = await run('<meta name="googlebot" content="nosnippet"><meta name="googlebot" content="notranslate">')
    expect(r.type).toBe('info')
    expect(r.presentation?.values).toContainEqual({ key: 'googlebot meta tags', value: 2, kind: 'text' })
  })

  it('surfaces noindex hidden in one of several googlebot meta tags', async () => {
    const r = await run('<meta name="googlebot" content="nosnippet"><meta name="googlebot" content="noindex">')
    expect(r.type).toBe('warn')
    expect(r.presentation?.values).toContainEqual({ key: 'Instructions', value: 'noindex, nosnippet', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Applies to', value: 'googlebot', kind: 'text' })
  })

  it('does not miss a restriction after the tenth tag or in the body with mixed-case names', async () => {
    const harmless = '<meta name="googlebot" content="index">'.repeat(12)
    const r = await run(`<head>${harmless}</head><body><meta name="GoogleBot" content="noindex"></body>`)
    expect(r.type).toBe('warn')
    expect(r.presentation?.values).toContainEqual({ key: 'googlebot meta tags', value: 13, kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Instructions', value: 'noindex, index', kind: 'text' })
    expect(r.presentation?.evidence.filter(({ name }) => name.startsWith('<meta name="googlebot"> '))).toHaveLength(10)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Markup retained', value: 10, kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Markup omitted', value: 3, kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Evidence omitted', value: 3, kind: 'text' })
  })

  it('preserves the documentation reference and removes the legacy details payload', async () => {
    const r = await run('<meta name="googlebot" content="index">')
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
    expect(toResultCopyPayload(r)).not.toContain('[object Object]')
  })
})
