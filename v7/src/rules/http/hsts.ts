import { headerValue } from '@/shared/headerValue'
import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'Strict-Transport-Security (HSTS)'
const RULE_ID = 'http:hsts'
const PRELOAD_MIN_MAX_AGE = 31536000

const parseMaxAge = (header: string): number | null => {
  const declarations = header.split(';').map(part => part.trim()).filter(part => /^max-age(?:\s|=|$)/i.test(part))
  if (declarations.length !== 1) return null
  const match = /^max-age\s*=\s*(?:"(\d+)"|(\d+))$/i.exec(declarations[0]!)
  const value = match ? Number(match[1] || match[2]) : NaN
  return Number.isSafeInteger(value) ? value : null
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
    userGuide: {
      check: "HSTS tells browsers to keep using HTTPS for the stated number of seconds. It only takes effect over a secure HTTPS response. includeSubDomains extends the policy to subdomains; preload is a separate opt-in process.",
      action: "If HTTPS is ready, configure a valid Strict-Transport-Security max-age value on HTTPS responses. Include subdomains only when they all support HTTPS. A max-age of 0 deliberately removes this host policy; verify whether that is intended before changing it.",
    },
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
    const hstsHeader = headerValue(page.headers, 'strict-transport-security')
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
          snippet: extractSnippet('(not present)'),
          hstsHeader: '',
          hasHsts: false,
        },
      }
    }
    const maxAge = parseMaxAge(hstsHeader)
    const includeSubDomains = /(?:^|;)\s*includeSubDomains\s*(?:;|$)/i.test(hstsHeader)
    const preload = /(?:^|;)\s*preload\s*(?:;|$)/i.test(hstsHeader)
    const preloadEligible = maxAge !== null && maxAge >= PRELOAD_MIN_MAX_AGE && includeSubDomains
    let message = `HSTS: max-age=${maxAge}${includeSubDomains ? ', includeSubDomains' : ''}${preload ? ', preload' : ''}`
    let type: 'ok' | 'warn' = 'ok'
    let priority = 750
    if (!isHttpsUrl(page.url)) {
      message = 'HSTS was sent over HTTP; browsers ignore this policy on an insecure response.'
      type = 'warn'
    } else if (maxAge === null) {
      message = 'HSTS needs one valid max-age duration in whole seconds within the numeric range supported by this check.'
      type = 'warn'
    } else if (maxAge === 0) {
      message = 'HSTS max-age=0 requests removal of this host policy. An inherited or preloaded HSTS policy may still apply.'
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
        snippet: extractSnippet(hstsHeader),
        hstsHeader,
        hasHsts: true,
        maxAge,
        durationUnit: 'seconds',
        preloadStatus: 'The preload token does not prove acceptance into a browser preload list; eligibility and list membership were not checked.',
        includeSubDomains,
        preload,
      },
    }
  },
}
