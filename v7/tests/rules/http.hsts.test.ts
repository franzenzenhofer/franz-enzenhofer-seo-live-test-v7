import { describe, it, expect } from 'vitest'

import { hstsRule } from '@/rules/http/hsts'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (h: Record<string, string>, url = 'https://ex.com/') => ({ html: '', url, doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers: h })

describe('rule: http hsts', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await hstsRule.run(P({}), { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(50)
    expect(r.presentation?.input).toBe('Not captured')
    expect(r.presentation?.values).toContainEqual({ key: 'Header capture', value: 'Not captured', kind: 'text' })
  })
  it('warns on missing HSTS on HTTPS pages', async () => {
    const r = await hstsRule.run(P({ 'content-type': 'text/html' }), { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.presentation?.values).toContainEqual({ key: 'Strict-Transport-Security', value: 'Not present', kind: 'text' })
  })
  it('reports info (not warn) on missing HSTS over HTTP', async () => {
    const r = await hstsRule.run(P({ 'content-type': 'text/html' }, 'http://ex.com/'), { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
  })
  it('ok on present', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'max-age=31536000' }), { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.presentation?.values).toContainEqual({ key: 'max-age seconds', value: 31536000, kind: 'text' })
  })
  it('parses directives case-insensitively per RFC 6797', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'Max-Age=31536000; IncludeSubDomains' }), { globals: {} })
    expect(r.presentation?.values).toContainEqual({ key: 'max-age seconds', value: 31536000, kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'includeSubDomains', value: 'Present', kind: 'text' })
  })
  it('parses quoted max-age values', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'max-age="31536000"' }), { globals: {} })
    expect(r.presentation?.values).toContainEqual({ key: 'max-age seconds', value: 31536000, kind: 'text' })
  })
  it('warns on max-age=0 (policy removal)', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'max-age=0' }), { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(300)
    expect(r.presentation?.values).toContainEqual({ key: 'max-age seconds', value: 0, kind: 'text' })
  })
  it('notes unmet preload requirements', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'max-age=300; preload' }), { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Preload eligibility', value: 'Not eligible by checked thresholds', kind: 'text' })
  })
  it('reports eligible preload thresholds', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'max-age=31536000; includeSubDomains; preload' }), { globals: {} })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Preload eligibility', value: 'Eligible by checked thresholds', kind: 'text' })
  })
})

it('does not call malformed max-age a deliberate policy removal', async () => {
  const result = await hstsRule.run(P({ 'Strict-Transport-Security': 'max-age=nope' }), { globals: {} })
  expect(result.type).toBe('warn')
  expect(result.presentation?.values).toContainEqual({ key: 'max-age seconds', value: 'Invalid or not parsed', kind: 'text' })
  expect(result.presentation?.detailValues).toContainEqual({ key: 'Preload eligibility', value: 'Not evaluated', kind: 'text' })
})
it('does not pass an HSTS policy delivered over insecure HTTP', async () => {
  const result = await hstsRule.run(P({ 'strict-transport-security': 'max-age=31536000' }, 'http://example.test/'), { globals: {} })
  expect(result.type).toBe('warn')
  expect(result.presentation?.values).toContainEqual({ key: 'Page protocol', value: 'HTTP', kind: 'text' })
})

it('rejects unmatched quotes and duplicate max-age declarations', async () => {
  for (const value of ['max-age="60', 'max-age=60"', 'max-age=60; max-age=120']) {
    const result = await hstsRule.run(P({ 'strict-transport-security': value }), { globals: {} })
    expect(result.type).toBe('warn')
    expect(result.presentation?.values).toContainEqual({ key: 'max-age seconds', value: 'Invalid or not parsed', kind: 'text' })
  }
})

it('copies references and labelled facts without legacy details', async () => {
  const result = enrichResult(await hstsRule.run(P({ 'strict-transport-security': 'max-age=31536000' }), { globals: {} }), hstsRule, 'test')
  const copy = toResultCopyPayload(result)
  for (const value of ['max-age=31536000', ...hstsRule.meta.references]) expect(copy).toContain(value)
  expect(result.details).toBeUndefined()
})
