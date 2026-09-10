import { expect, it } from 'vitest'

import { httpStatusRule } from '@/rules/http/status'
import { ruleInputForId } from '@/rules/ruleInputs'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'
const run = async (status?: number) => enrichResult(await httpStatusRule.run({
  html: '', url: 'https://example.test/page', doc: new DOMParser().parseFromString('', 'text/html'), status,
}, { globals: {} }), httpStatusRule, 'test')

it('waits for context capture and reports a named status even without response headers', async () => {
  expect(ruleInputForId('http-status')).toBe('context')
  expect((await run(200)).message).toBe('HTTP 200 OK')
  expect((await run(308)).message).toBe('HTTP 308 Permanent Redirect')
  expect((await run(429)).message).toBe('HTTP 429 Too Many Requests')
})
it('distinguishes unavailable evidence from a site failure and revalidation from redirection', async () => {
  expect((await run()).type).toBe('runtime_error')
  const result = await run(304)
  expect(result.type).toBe('info')
  expect(result.details?.['interpretation']).toContain('not a redirect')
})
it('copies the affected URL, status meaning and conditional remedy for removed content', async () => {
  const result = await run(404)
  expect(result.type).toBe('error')
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('https://example.test/page')
  expect(copy).toContain('HTTP 404 Not Found')
  expect(copy).toContain('when deletion is intentional')
})
