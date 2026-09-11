import { describe, expect, it } from 'vitest'

import { robotsNosnippetRule as rule } from '@/rules/head/robotsNosnippet'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string, headers?: Record<string, string>) => enrichResult(
  await rule.run({ html, url: 'https://ex.com', doc: doc(html), headers }, { globals: {} }), rule, 'test',
)

describe('head: robots nosnippet', () => {
  it('warns when nosnippet is present', async () => {
    const html = '<meta name="robots" content="nosnippet">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(220)
    expect(r.presentation?.values).toContainEqual({ key: 'nosnippet restrictions', value: 1, kind: 'text' })
    expect(r.presentation?.markup[0]?.value).toBe(html)
  })

  it('warns when max-snippet:0 is present (equivalent restriction)', async () => {
    const r = await run('<meta name="robots" content="max-snippet:0">')
    expect(r.type).toBe('warn')
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Instruction', value: 'max-snippet:0', kind: 'text' })
  })

  it('retains one markup record when one element carries both nosnippet and max-snippet:0', async () => {
    const r = await run('<meta name="robots" content="nosnippet, max-snippet:0">')
    expect(r.presentation?.evidence).toHaveLength(2)
    expect(r.presentation?.markup).toHaveLength(1)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Elements retained', value: 1, kind: 'text' })
  })

  it('reports info when directive is absent, with headers not captured', async () => {
    const r = await run('<meta name="robots" content="index,follow">')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.input).toBe('Static DOM')
  })

  it('preserves the documentation reference and userGuide, and removes the legacy details payload', async () => {
    const r = await run('<meta name="robots" content="nosnippet">', {})
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(rule.meta.userGuide?.action).toBeTruthy()
    expect(r.presentation?.input).toBe('Static DOM + HTTP response headers')
    expect(r.details).toBeUndefined()
    expect(toResultCopyPayload(r)).not.toContain('[object Object]')
  })
})
