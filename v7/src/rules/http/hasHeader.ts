import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'HTTP Header Presence (Configurable)'
const RULE_ID = 'http:has-header'

export const hasHeaderRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    userGuide: {
      check: "Checks only the header names configured in http_has_header. An empty configuration means this custom check has no requirements. Presence does not validate a header value or make every listed header necessary for all sites.",
      action: "Compare the missing list with the intended http_has_header configuration. Add required headers in the application, server or CDN response configuration, or correct the configured list if the requirement is wrong.",
    },
    provenance: 'franz',
    references: [],
    description:
      'User-configurable presence check: reads the comma-separated "http_has_header" variable and reports ok when all requested response headers are present, warn listing the missing ones otherwise.',
  },
  async run(page, ctx) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const raw = String((vars as Record<string, unknown>)['http_has_header'] || '').trim()
    if (!raw) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No headers configured. Set "http_has_header" variable (comma-separated list).',
        type: 'info',
        priority: 900,
        details: { httpHeaders: page.headers || {} },
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
      },
    }
  },
}
