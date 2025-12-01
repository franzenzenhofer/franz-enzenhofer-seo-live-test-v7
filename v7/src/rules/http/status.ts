import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'HTTP Status'
const RULE_ID = 'http-status'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status'

const classify = (s?: number) => {
  if (!s) return { type: 'warn', message: 'Status unknown', priority: 100, statusClass: 'Unknown' }
  if (s >= 200 && s < 300) return { type: 'ok', message: `HTTP ${s} Success`, priority: 800, statusClass: '2xx' }
  if (s >= 300 && s < 400)
    return { type: 'info', message: `HTTP ${s} Redirect`, priority: 700, statusClass: '3xx' }
  if (s >= 400 && s < 500)
    return { type: 'error', message: `HTTP ${s} Client Error`, priority: 50, statusClass: '4xx' }
  if (s >= 500) return { type: 'error', message: `HTTP ${s} Server Error`, priority: 30, statusClass: '5xx' }
  return { type: 'info', message: `HTTP ${s}`, priority: 750, statusClass: 'Other' }
}

export const httpStatusRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  run: async (page) => {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const status = page.status
    const c = classify(status)
    return {
      label: LABEL,
      name: NAME,
      message: c.message,
      type: c.type as 'ok' | 'warn' | 'error' | 'info',
      priority: c.priority,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(String(status || 'unknown')),
        status,
        statusClass: c.statusClass,
        reference: SPEC,
      },
    }
  },
}
