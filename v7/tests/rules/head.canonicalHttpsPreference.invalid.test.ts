import { expect, it } from 'vitest'

import { canonicalHttpsPreferenceRule } from '@/rules/head/canonicalHttpsPreference'

it.each(['http://[', 'javascript:void(0)'])('identifies invalid web canonical %s without throwing or passing', async href => {
  const doc = new DOMParser().parseFromString(`<link rel="canonical" href="${href}">`, 'text/html')
  const result = await canonicalHttpsPreferenceRule.run({ html: '', url: 'https://example.test/', doc }, { globals: {} })
  expect(result.type).toBe('warn')
  expect(result.details?.['canonicalUrl']).toBe(href)
})
