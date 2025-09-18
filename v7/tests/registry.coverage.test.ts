import { describe, it, expect } from 'vitest'
import { registry } from '@/rules/registry'

const mustHave = [
  // concise representative anchors across categories
  'head-title', 'head-canonical', 'og-title', 'og-description', 'http-status', 'robots-exists',
  'body-h1', 'dom:ldjson', 'url:trailing-slash', 'discover:max-image-preview-large',
]

describe('registry coverage', () => {
  it('contains all expected rules and unique IDs', () => {
    const ids = new Set<string>()
    for (const r of registry) {
      expect(ids.has(r.id)).toBe(false)
      ids.add(r.id)
    }
    const norm = (s: string) => s.replace(/:/g, '-')
    const idsNorm = new Set(Array.from(ids).map(norm))
    for (const id of mustHave) {
      expect(idsNorm.has(norm(id))).toBe(true)
    }
    // At least as many as legacy + new discover ones
    expect(ids.size).toBeGreaterThanOrEqual(80)
  })
})
