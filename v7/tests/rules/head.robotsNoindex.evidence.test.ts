import { describe, expect, it } from 'vitest'

import { robotsNoindexRule as rule } from '@/rules/head/robotsNoindex'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(
  await rule.run({ html, url: 'https://example.test/', doc: doc(html) }, { globals: {} }), rule, 'test',
)

describe('rule: robots noindex', () => {
  it('reports absence as info', async () => {
    const r = await run('<html><head></head></html>')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(700)
  })

  it('accepts multiple permissive tags and distinguishes nofollow from an indexing block', async () => {
    const r = await run('<meta name="robots" content="index"><meta name="robots" content="nofollow">')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(700)
    expect(r.presentation?.values).toContainEqual({ key: 'Instructions', value: 'nofollow, index', kind: 'text' })
    expect(r.presentation?.checked).toContainEqual({ key: 'Criterion', value: 'Warn when noindex or none is present (nofollow does not affect this criterion)', kind: 'text' })
  })

  it('warns when noindex is present', async () => {
    const html = '<meta name="robots" content="noindex">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(150)
    expect(r.presentation?.markup[0]?.value).toBe(html)
  })

  it('preserves the documentation reference and removes the legacy details payload', async () => {
    const r = await run('<meta name="robots" content="index">')
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
    expect(toResultCopyPayload(r)).not.toContain('[object Object]')
  })
})
