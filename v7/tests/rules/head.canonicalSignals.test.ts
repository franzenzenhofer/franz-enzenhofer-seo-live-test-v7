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
    expect((res.details as any).canonicalUrl).toBe('https://ex.com')
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
  })

  it('warns when both HTML and HTTP canonicals match', async () => {
    const page = {
      html: '',
      url: 'https://ex.com/a',
      doc: doc('<link rel="canonical" href="https://ex.com/a">'),
      headers: { link: '<https://ex.com/a>; rel="canonical"' },
    }
    const res = await canonicalSignalsConflictRule.run(page as any, { globals: {} })
    expect(res.type).toBe('warn')
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
