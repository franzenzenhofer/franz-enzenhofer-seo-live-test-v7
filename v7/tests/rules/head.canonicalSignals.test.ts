import { describe, it, expect } from 'vitest'

import { canonicalHeaderRule } from '@/rules/head/canonicalHeader'
import { canonicalSignalsConflictRule } from '@/rules/head/canonicalSignalsConflict'
import { canonicalHttpsPreferenceRule } from '@/rules/head/canonicalHttpsPreference'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('canonical header and signal rules', () => {
  it('reports canonical HTTP header', async () => {
    const page = { html: '', url: 'https://ex.com', doc: doc('<p/>'), headers: { link: '<https://ex.com>; rel="canonical"' } }
    const res = await canonicalHeaderRule.run(page as any, { globals: {} })
    expect(res.type).toBe('ok')
    expect(res.presentation?.values).toContainEqual({ key: 'HTTP canonical', value: 'https://ex.com', kind: 'url' })
    expect(res.details).toBeUndefined()
  })

  it('errors when HTML and HTTP canonicals differ', async () => {
    const page = {
      html: '',
      url: 'https://ex.com/a',
      doc: doc('<link rel="canonical" href="https://ex.com/a">'),
      headers: { link: '<http://ex.com/a>; rel="canonical"' },
    }
    const res = await canonicalSignalsConflictRule.run(page as any, { globals: {} })
    expect(res.type).toBe('error')
    expect(res.priority).toBe(80)
    expect(res.details).toBeUndefined()
  })

  it('errors on multiple canonical HTTP headers (owned by head:canonical-header)', async () => {
    const page = {
      html: '',
      url: 'https://ex.com/a',
      doc: doc('<link rel="canonical" href="https://ex.com/a">'),
      headers: { link: '<https://ex.com/a>; rel="canonical", <https://ex.com/b>; rel="canonical"' },
    }
    const res = await canonicalHeaderRule.run(page as any, { globals: {} })
    expect(res.type).toBe('error')
    expect(res.message).toContain('HTTP canonicals: 2')
    // The conflict rule compares against the first header canonical only and
    // does not double-report the multiple-header defect.
    const conflict = await canonicalSignalsConflictRule.run(page as any, { globals: {} })
    expect(conflict.message).not.toContain('HTTP canonicals: 2')
  })

  it('warns (not errors) when both HTML and HTTP canonicals match - supported but error prone', async () => {
    const page = {
      html: '',
      url: 'https://ex.com/a',
      doc: doc('<link rel="canonical" href="https://ex.com/a">'),
      headers: { link: '<https://ex.com/a>; rel="canonical"' },
    }
    const res = await canonicalSignalsConflictRule.run(page as any, { globals: {} })
    expect(res.type).toBe('warn')
    expect(res.presentation?.values).toContainEqual({ key: 'Comparison', value: 'Equals HTTP canonical', kind: 'text' })
  })

  it('flags HTTPS to HTTP downgrade', async () => {
    const page = {
      html: '',
      url: 'https://ex.com/a',
      doc: doc('<link rel="canonical" href="http://ex.com/a">'),
      headers: {},
    }
    const res = await canonicalHttpsPreferenceRule.run(page as any, { globals: {} })
    expect(res.type).toBe('error')
  })
})
