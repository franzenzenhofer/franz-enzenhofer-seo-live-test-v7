import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'Strict-Transport-Security (HSTS)'
const RULE_ID = 'http:hsts'
const PRELOAD_MIN_MAX_AGE = 31536000

const parseMaxAge = (header: string): number => {
  for (const directive of header.split(';')) {
    const match = directive.trim().match(/^max-age\s*=\s*"?(\d+)"?$/i)
    if (match && match[1]) return parseInt(match[1], 10)
  }
  return 0
}

const isHttpsUrl = (url: string): boolean => {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

export const hstsRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'general',
    references: [
      'https://www.rfc-editor.org/rfc/rfc6797',
      'https://hstspreload.org/',
      'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html',
      'https://web.dev/articles/security-headers',
    ],
    description:
      'Checks the Strict-Transport-Security response header: warns when absent, reports max-age / includeSubDomains / preload when present.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const hstsHeader = page.headers?.['strict-transport-security']?.trim() || ''
    const hasHsts = Boolean(hstsHeader)
    if (!hasHsts) {
      const https = isHttpsUrl(page.url)
      return {
        label: LABEL,
        name: NAME,
        message: https
          ? 'Missing Strict-Transport-Security header. HTTPS sites should use HSTS.'
          : 'No Strict-Transport-Security header. HSTS only applies to HTTPS responses; browsers ignore it over HTTP.',
        type: https ? 'warn' : 'info',
        priority: https ? 300 : 900,
        details: {
          httpHeaders: page.headers || {},
          snippet: extractSnippet('(not present)'),
          hstsHeader: '',
          hasHsts: false,
        },
      }
    }
    const maxAge = parseMaxAge(hstsHeader)
    const includeSubDomains = /(?:^|;)\s*includeSubDomains\s*(?:;|$)/i.test(hstsHeader)
    const preload = /(?:^|;)\s*preload\s*(?:;|$)/i.test(hstsHeader)
    const preloadEligible = maxAge >= PRELOAD_MIN_MAX_AGE && includeSubDomains
    let message = `HSTS: max-age=${maxAge}${includeSubDomains ? ', includeSubDomains' : ''}${preload ? ', preload' : ''}`
    let type: 'ok' | 'warn' = 'ok'
    let priority = 750
    if (maxAge === 0) {
      message = 'HSTS max-age=0: the policy is being removed; browsers stop enforcing HSTS for this host.'
      type = 'warn'
      priority = 300
    } else if (preload && !preloadEligible) {
      message += ' (preload requires max-age >= 31536000 and includeSubDomains)'
    }
    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(hstsHeader),
        hstsHeader,
        hasHsts: true,
        maxAge,
        includeSubDomains,
        preload,
      },
    }
  },
}
