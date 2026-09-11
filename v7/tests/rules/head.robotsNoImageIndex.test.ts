import { describe, expect, it } from 'vitest'

import { robotsNoImageIndexRule as rule } from '@/rules/head/robotsNoImageIndex'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string, headers?: Record<string, string>) => enrichResult(
  await rule.run({ html, url: 'https://ex.com', doc: doc(html), headers }, { globals: {} }), rule, 'test',
)

describe('head: robots noimageindex', () => {
  it('warns when noimageindex is present and retains original markup', async () => {
    const html = '<meta name="robots" content="noimageindex">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(220)
    expect(r.presentation?.values).toContainEqual({ key: 'noimageindex restrictions', value: 1, kind: 'text' })
    expect(r.presentation?.markup[0]?.value).toBe(html)
  })

  it('reports info when directive is absent, with headers not captured', async () => {
    const r = await run('<meta name="robots" content="index,follow">')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.input).toBe('Static DOM')
  })

  it('preserves the documentation reference and userGuide, and removes the legacy details payload', async () => {
    const r = await run('<meta name="robots" content="noimageindex">', {})
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(rule.meta.userGuide?.action).toBeTruthy()
    expect(r.presentation?.input).toBe('Static DOM + HTTP response headers')
    expect(r.details).toBeUndefined()
    expect(toResultCopyPayload(r)).not.toContain('[object Object]')
  })
})
