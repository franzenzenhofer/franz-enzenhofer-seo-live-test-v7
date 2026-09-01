import { describe, it, expect } from 'vitest'

import { metaUnavailableAfterRule } from '@/rules/head/metaUnavailableAfter'
import type { DomPhaseFacts } from '@/shared/domFacts'
import type { Page } from '@/core/types'

const facts = (over: Partial<DomPhaseFacts> = {}): DomPhaseFacts => ({
  phase: 'static', nodeCount: 1, maxDepth: 1, textLength: 0, scriptCount: 0, blockingScriptCount: 0,
  anchorCount: 0, parameterizedLinkCount: 0, parameterizedLinks: [], parameterizedLinksTruncated: false,
  elements: [], elementsTruncated: false, truncatedBuckets: [], criticalTruncated: false,
  documentAttributes: [], ...over,
})

const run = (staticFacts: DomPhaseFacts, idleFacts: DomPhaseFacts) =>
  metaUnavailableAfterRule.run({ staticFacts, idleFacts } as unknown as Page, { globals: {} } as never)

describe('head:unavailable-after gating', () => {
  it('still runs when only anchors and resources were sampled', async () => {
    const sampled = facts({ elementsTruncated: true, truncatedBuckets: ['anchor', 'resource'] })
    const res = await run(sampled, facts({ ...sampled, phase: 'idle' }))
    expect((res as { type: string }).type).not.toBe('runtime_error')
  })

  it('reads the unavailable_after directive from head facts', async () => {
    const withMeta = facts({
      elementsTruncated: true, truncatedBuckets: ['anchor'],
      elements: [{ location: 'head', tag: 'meta', attrs: [['name', 'robots'], ['content', 'unavailable_after: 25-Aug-2007 15:00:00 EST']] }],
    })
    const res = await run(withMeta, facts({ ...withMeta, phase: 'idle' })) as { message: string }
    expect(res.message).toContain('unavailable_after')
  })

  it('refuses only when a critical fact was actually dropped', async () => {
    const lost = facts({ elementsTruncated: true, criticalTruncated: true, truncatedBuckets: ['head'] })
    const res = await run(lost, facts({ ...lost, phase: 'idle' }))
    expect((res as { type: string }).type).toBe('runtime_error')
  })
})
