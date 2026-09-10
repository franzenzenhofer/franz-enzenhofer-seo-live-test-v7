import { expect, it } from 'vitest'

import { robotsNoindexRule } from '@/rules/head/robotsNoindex'

it('accepts multiple permissive tags and distinguishes nofollow from an indexing block', async () => {
  const doc = new DOMParser().parseFromString('<meta name="robots" content="index"><meta name="robots" content="nofollow">', 'text/html')
  const result = await robotsNoindexRule.run({ html: '', url: 'https://example.test/', doc }, { globals: {} })
  expect(result.type).toBe('info')
  expect(result.details?.['hasNoindex']).toBe(false)
  expect(result.message).toContain('does not block page indexing')
})
