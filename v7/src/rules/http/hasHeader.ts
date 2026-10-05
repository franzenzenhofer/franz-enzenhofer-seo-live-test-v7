import { HEADER_NO_MARKUP } from '@/rules/http/observedHeader'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'
import { listRow } from '@/shared/presentation/listRow'

const NAME = 'HTTP Header Presence (Configurable)'
const RULE_ID = 'http:has-header'
const CONFIG_VAR = 'http_has_header'

export const hasHeaderRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
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
    if (!hasHeaders(page.headers)) {
      return presentResult(hasHeaderRule, page, {
        input: 'Not captured', type: 'runtime_error', priority: 50,
        values: [textField('Response headers', 'Not captured')],
        checked: [textField('Configuration variable', CONFIG_VAR), textField('Capture requirement', 'HTTP response headers')],
        noMarkup: HEADER_NO_MARKUP,
      })
    }
    const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const raw = String((vars as Record<string, unknown>)[CONFIG_VAR] || '').trim()
    if (!raw) {
      return presentResult(hasHeaderRule, page, {
        input: 'HTTP response headers', type: 'info', priority: 900,
        values: [textField('Configured headers', 'None')],
        checked: [textField('Configuration variable', CONFIG_VAR), textField('Criterion', 'Every configured header name is present with a non-empty value')],
        noMarkup: HEADER_NO_MARKUP,
      })
    }
    const requestedHeaders = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    const presentHeaders: string[] = []
    const missingHeaders: string[] = []
    requestedHeaders.forEach((header) => {
      const value = page.headers?.[header] || ''
      if (value) presentHeaders.push(header)
      else missingHeaders.push(header)
    })
    const allPresent = missingHeaders.length === 0
    let type: 'ok' | 'warn' = 'ok'
    let priority = 700
    if (allPresent) {
      priority = 750
    } else if (presentHeaders.length === 0) {
      type = 'warn'
      priority = 200
    } else {
      type = 'warn'
      priority = 300
    }
    return presentResult(hasHeaderRule, page, {
      input: 'HTTP response headers', type, priority,
      values: [textField('Present headers', listRow(presentHeaders)), textField('Absent headers', listRow(missingHeaders))],
      checked: [textField('Configuration variable', CONFIG_VAR), textField('Configured headers', requestedHeaders.join(', ')), textField('Criterion', 'Every configured header name is present with a non-empty value')],
      evidence: requestedHeaders.map((header) => ({ name: header, fields: [textField('Header', presentHeaders.includes(header) ? 'Present' : 'Absent')] })),
      noMarkup: HEADER_NO_MARKUP,
    })
  },
}
