import { expect, it } from 'vitest'

import { httpStatusRule } from '@/rules/http/status'
import { ruleInputForId } from '@/rules/ruleInputs'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'
import { HEAD_PROBE_RESPONSE, MAIN_DOCUMENT_RESPONSE, NO_NAVIGATION_RESPONSE } from '@/shared/httpResponseInput'
type Extra = { headerSource?: 'events' | 'probe'; events?: Array<{ t: string }> }
const run = async (status?: number, headers?: Record<string, string>, { headerSource, events }: Extra = {}) => enrichResult(await httpStatusRule.run({
  html: '', url: 'https://example.test/page', doc: new DOMParser().parseFromString('', 'text/html'), status, headers, headerSource,
}, { globals: events ? { events } : {} }), httpStatusRule, 'test')
const detail = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.detailValues.find((f) => f.key === key)?.value

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
it('names the navigation response as its input when the main frame answered', async () => {
  const r = await run(200, { 'content-type': 'text/html' }, { headerSource: 'events', events: [{ t: 'nav:before' }, { t: 'nav:commit' }] })
  expect(r.presentation?.input).toBe(MAIN_DOCUMENT_RESPONSE)
  expect(detail(r, 'Response source')).toBe('Navigation response (webRequest, main frame)')
  expect(r.presentation?.values.some((f) => f.key === 'Navigation')).toBe(false)
})
it('never presents a HEAD probe as the navigation response; after a soft navigation it says why there is none', async () => {
  const probed = await run(200, { 'content-type': 'text/html' }, { headerSource: 'probe' })
  expect(probed.presentation?.input).toBe(HEAD_PROBE_RESPONSE)
  expect(detail(probed, 'Response source')).toBe('Separate HEAD request of the page URL')
  const soft = await run(200, { 'content-type': 'text/html' }, { headerSource: 'probe', events: [{ t: 'nav:history' }, { t: 'dom:document_idle' }] })
  expect(soft.presentation?.values).toContainEqual({ key: 'Navigation', value: 'History API, no document load', kind: 'text' })
  expect(soft.presentation?.checked).toContainEqual(expect.objectContaining({ key: 'Soft navigation', value: NO_NAVIGATION_RESPONSE }))
  expect(soft.type).toBe('ok')
  expect((await run(undefined)).presentation?.input).toBe('Not captured')
})
it('copies the affected URL, named status, references and labelled headers without advice', async () => {
  const result = await run(404, { 'content-type': 'text/html', 'x-trace': 'original header value' })
  const copy = toResultCopyPayload(result)
  for (const value of ['https://example.test/page', 'HTTP 404 Not Found', 'x-trace: original header value', ...httpStatusRule.meta.references]) expect(copy).toContain(value)
  expect(copy).not.toContain('when deletion is intentional')
  expect(result.details).toBeUndefined()
})
