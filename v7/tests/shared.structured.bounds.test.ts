import { describe, expect, it } from 'vitest'

import { runAll } from '@/core/run'
import type { Rule } from '@/core/types'
import { schemaArticlePresentRule } from '@/rules/schema/articlePresent'
import { LD_LIMITS, parseLd } from '@/shared/structured'

const documentWithLd = (payload: string) => {
  const doc = new DOMParser().parseFromString('<html><body><script type="application/ld+json"></script></body></html>', 'text/html')
  doc.querySelector('script')!.textContent = payload
  return doc
}

describe('bounded structured data', () => {
  it('rejects oversized LD+JSON before parsing it', () => {
    const doc = documentWithLd(JSON.stringify({ value: 'x'.repeat(LD_LIMITS.bytes) }))
    expect(() => parseLd(doc)).toThrow('1 MB bounded contract')
  })

  it('contains an oversized input failure to its rule', async () => {
    const doc = documentWithLd(JSON.stringify({ value: 'x'.repeat(LD_LIMITS.bytes) }))
    const safeRule: Rule = {
      id: 'stress:safe',
      name: 'Safe rule',
      enabled: true,
      async run() { return { name: 'Safe rule', label: 'STRESS', message: 'completed', type: 'ok' } },
    }
    const results = await runAll(0, [schemaArticlePresentRule, safeRule], {
      html: '', url: 'https://example.com', doc,
    }, { globals: {} })

    expect(results.map((result) => result.type)).toEqual(['runtime_error', 'ok'])
    expect(results[0]?.message).toContain('1 MB bounded contract')
    expect(results[1]?.message).toBe('completed')
  })
})
