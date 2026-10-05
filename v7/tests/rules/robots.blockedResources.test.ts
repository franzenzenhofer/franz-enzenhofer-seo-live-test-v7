import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsBlockedResourcesRule as rule } from '@/rules/robots/blockedResources'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = () => new DOMParser().parseFromString('<p/>', 'text/html')
const run = async (url: string, resources: string[]) => enrichResult(await rule.run({ html: '', url, doc: D(), resources } as never, { globals: {} }), rule, 'test')
const stub = (txt: string) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => txt }))
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('rule: robots blocked resources', () => {
  afterEach(() => vi.restoreAllMocks())

  it('warns when a resource is disallowed', async () => {
    stub('User-agent: *\nDisallow: /blocked')
    const result = await run('https://blockwarn.test/page', ['https://blockwarn.test/blocked/a.js', 'https://blockwarn.test/open/b.js'])
    expect(result.type).toBe('warn'); expect(result.priority).toBe(200)
    expect(value(result, 'Blocked resources')).toBe(1)
    expect(result.presentation?.evidence.find((e) => e.name === 'Blocked resource 1')?.fields).toEqual([
      { key: 'Resource URL', value: 'https://blockwarn.test/blocked/a.js', kind: 'url' }])
    expect(result.details).toBeUndefined()
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('treats an equally specific allow/disallow tie as allowed (least restrictive rule wins)', async () => {
    stub('User-agent: *\nAllow: /assets\nDisallow: /assets')
    const result = await run('https://tie.test/page', ['https://tie.test/assets/a.js'])
    expect(result.type).toBe('ok'); expect(result.priority).toBe(800)
    expect(value(result, 'Blocked resources')).toBe(0)
  })

  it('reports no same-origin resources when only cross-origin resources were retained', async () => {
    stub('User-agent: *\nDisallow:')
    const result = await run('https://nosameorigin.test/page', ['https://cdn.other.test/a.js'])
    expect(result.type).toBe('info'); expect(result.priority).toBe(850)
    expect(value(result, 'Resources checked')).toBe(0)
    expect(value(result, 'Cross-origin resources')).toBe(1)
  })

  it('reports not checked when no resources were captured', async () => {
    const result = await run('https://noresources.test/page', [])
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(result.presentation?.input).toBe('Not captured')
    expect(result.presentation?.values).toEqual([
      { key: 'Resource requests', value: 'Not captured', kind: 'text' }, { key: 'Resources checked', value: 'Not checked', kind: 'text' }])
  })

  it('reports not checked when robots.txt is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    const result = await run('https://robotsdown.test/page', ['https://robotsdown.test/a.js'])
    expect(result.type).toBe('info'); expect(result.priority).toBe(850)
    expect(value(result, 'Resources checked')).toBe('Not checked')
    expect(value(result, 'Response')).toBe('Request failed')
    expect(result.presentation?.input).toBe('Resource requests')
  })
})
