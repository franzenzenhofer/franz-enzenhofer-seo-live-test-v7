import { describe, it, expect } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { historyStateUpdateRule as rule } from '@/rules/url/historyStateUpdate'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const page = () => ({ html: '', url: 'https://example.com/', doc: new DOMParser().parseFromString('<html></html>', 'text/html') })
const run = async (events?: Array<{ t?: string }>) => enrichResult(await rule.run(page() as any, { globals: { events } }), rule, 'test')
const value = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.values.find((f) => f.key === key)?.value

describe('rule: history state update detected', () => {
  it('reports no update and Not captured input when no events were recorded', async () => {
    const r = await run(undefined)
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(value(r, 'SPA history update observed')).toBe('No')
    expect(r.presentation?.input).toBe('Not captured')
  })

  it('reports no SPA-only update when a history event is followed by a commit', async () => {
    const r = await run([{ t: 'nav:history' }, { t: 'nav:commit' }])
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(value(r, 'SPA history update observed')).toBe('No')
    expect(r.presentation?.input).toBe('Navigation events')
    expect(r.presentation?.detailValues.find((f) => f.key === 'History (pushState/replaceState) events')?.value).toBe('Present')
    expect(r.presentation?.detailValues.find((f) => f.key === 'Document-commit events')?.value).toBe('Present')
  })

  it('reports an observed SPA-only history update without a document commit', async () => {
    const r = await run([{ t: 'nav:history' }])
    expect(r.type).toBe('info'); expect(r.priority).toBe(500)
    expect(value(r, 'SPA history update observed')).toBe('Yes')
    expect(r.presentation?.detailValues.find((f) => f.key === 'Document-commit events')?.value).toBe('Absent')
  })

  it('reports no update when only a commit event is present', async () => {
    const r = await run([{ t: 'nav:commit' }])
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(value(r, 'SPA history update observed')).toBe('No')
  })

  it('preserves all references and emits no legacy details', async () => {
    const r = await run(undefined)
    const copy = toResultCopyPayload(r)
    for (const ref of rule.meta.references) expect(copy).toContain(ref)
    expect(r.details).toBeUndefined()
  })
})
