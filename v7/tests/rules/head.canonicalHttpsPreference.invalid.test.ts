import { expect, it } from 'vitest'

import { canonicalHttpsPreferenceRule } from '@/rules/head/canonicalHttpsPreference'

it.each(['http://[', 'javascript:void(0)'])('identifies invalid web canonical %s without throwing or passing', async href => {
  const doc = new DOMParser().parseFromString(`<link rel="canonical" href="${href}">`, 'text/html')
  const result = await canonicalHttpsPreferenceRule.run({ html: '', url: 'https://example.test/', doc }, { globals: {} })
  expect(result.type).toBe('warn')
  expect(result.presentation?.values).toContainEqual({ key: 'Canonical href', value: href, kind: 'text' })
  expect(result.presentation?.values).toContainEqual({ key: 'Canonical URL', value: 'Invalid HTTP(S) URL', kind: 'text' })
  expect(result.details).toBeUndefined()
})
