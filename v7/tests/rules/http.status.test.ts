import { expect, it } from 'vitest'

import { httpStatusRule } from '@/rules/http/status'
import { ruleInputForId } from '@/rules/ruleInputs'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'
const run = async (status?: number, headers?: Record<string, string>) => enrichResult(await httpStatusRule.run({
  html: '', url: 'https://example.test/page', doc: new DOMParser().parseFromString('', 'text/html'), status, headers,
}, { globals: {} }), httpStatusRule, 'test')

it.each([[200, 'OK'], [308, 'Permanent Redirect'], [429, 'Too Many Requests'], [304, 'Not Modified']])('reports the standard name for HTTP %s', async (status, name) => {
  expect(ruleInputForId('http-status')).toBe('context')
  const result = await run(status as number)
  expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Response status', value: `HTTP ${status} ${name}` }))
})
it.each([undefined, 0, 99, 600, 200.5, NaN])('preserves unavailable/invalid capture state: %s', async (status) => {
  expect((await run(status)).type).toBe('runtime_error')
})
it.each([[103, 'info'], [204, 'ok'], [304, 'info'], [404, 'error'], [500, 'error']])('preserves classification for %s', async (status, expected) => {
  const result = await run(status as number)
  expect(result.type).toBe(expected)
  expect(result.presentation?.markup).toHaveLength(0)
  expect(result.presentation?.noMarkup).toContain('HTTP response')
})
it('copies the affected URL, named status, references and labelled headers without advice', async () => {
  const result = await run(404, { 'content-type': 'text/html', 'x-trace': 'original header value' })
  const copy = toResultCopyPayload(result)
  for (const value of ['https://example.test/page', 'HTTP 404 Not Found', 'x-trace: original header value', ...httpStatusRule.meta.references]) expect(copy).toContain(value)
  expect(copy).not.toContain('when deletion is intentional')
  expect(result.details).toBeUndefined()
})
