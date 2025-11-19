import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'HTTP'
const NAME = 'HTTP Header Presence (Configurable)'
const RULE_ID = 'http:has-header'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers'

export const hasHeaderRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page, ctx) {
    const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const raw = String((vars as Record<string, unknown>)['http_has_header'] || '').trim()
    if (!raw) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No headers configured. Set "http_has_header" variable (comma-separated list).',
        type: 'info',
        priority: 900,
        details: { httpHeaders: page.headers || {}, reference: SPEC },
      }
    }
    const requestedHeaders = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    const presentHeaders: string[] = []
    const missingHeaders: string[] = []
    requestedHeaders.forEach((header) => {
      const value = page.headers?.[header] || ''
      if (value) {
        presentHeaders.push(header)
      } else {
        missingHeaders.push(header)
      }
    })
    const allPresent = missingHeaders.length === 0
    let message = ''
    let type: 'ok' | 'warn' = 'ok'
    let priority = 700
    if (allPresent) {
      message = `All ${requestedHeaders.length} headers present: ${requestedHeaders.join(', ')}`
      type = 'ok'
      priority = 750
    } else if (presentHeaders.length === 0) {
      message = `All ${requestedHeaders.length} headers missing: ${missingHeaders.join(', ')}`
      type = 'warn'
      priority = 200
    } else {
      message = `${missingHeaders.length} missing: ${missingHeaders.join(', ')} (${presentHeaders.length} present)`
      type = 'warn'
      priority = 300
    }
    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(raw),
        requestedHeaders,
        presentHeaders,
        missingHeaders,
        reference: SPEC,
      },
    }
  },
}
