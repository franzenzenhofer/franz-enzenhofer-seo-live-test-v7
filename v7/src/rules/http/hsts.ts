import { headerValue } from '@/shared/headerValue'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'Strict-Transport-Security (HSTS)'
const RULE_ID = 'http:hsts'
const PRELOAD_MIN_MAX_AGE = 31536000
const NO_MARKUP = 'None - this rule checks the HTTP response, not document markup'

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
  presentation: 1,
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
    if (!hasHeaders(page.headers)) {
      return presentResult(hstsRule, page, {
        input: 'Not captured', type: 'runtime_error', priority: 50,
        values: [textField('Header capture', 'Not captured')],
        checked: [textField('Header name', 'Strict-Transport-Security'), textField('Capture requirement', 'Response headers must be captured')],
        noMarkup: NO_MARKUP,
      })
    }
    const hstsHeader = headerValue(page.headers, 'strict-transport-security')
    const hasHsts = Boolean(hstsHeader)
    const protocol = isHttpsUrl(page.url) ? 'HTTPS' : 'HTTP'
    const evidence = [{ name: 'Retrieved response header', fields: [textField('Header value', hasHsts ? hstsHeader : 'Not present'), textField('Header lookup', 'Case-insensitive')] }]
    if (!hasHsts) {
      const https = protocol === 'HTTPS'
      return presentResult(hstsRule, page, {
        input: 'HTTP response headers', type: https ? 'warn' : 'info', priority: https ? 300 : 900,
        values: [textField('Strict-Transport-Security', 'Not present'), textField('Page protocol', protocol)],
        checked: [textField('Header name', 'Strict-Transport-Security'), textField('Page protocol check', 'HTTPS or HTTP from the tested page URL'), textField('Header applicability', 'HTTPS response')],
        evidence, noMarkup: NO_MARKUP,
      })
    }
    const maxAge = parseMaxAge(hstsHeader)
    const includeSubDomains = /(?:^|;)\s*includeSubDomains\s*(?:;|$)/i.test(hstsHeader)
    const preload = /(?:^|;)\s*preload\s*(?:;|$)/i.test(hstsHeader)
    const preloadEligible = maxAge !== null && maxAge >= PRELOAD_MIN_MAX_AGE && includeSubDomains
    let type: 'ok' | 'warn' = 'ok'
    let priority = 750
    if (protocol !== 'HTTPS') {
      type = 'warn'
    } else if (maxAge === null) {
      type = 'warn'
    } else if (maxAge === 0) {
      type = 'warn'
      priority = 300
    }
    const eligibility = preload ? (preloadEligible ? 'Eligible by checked thresholds' : 'Not eligible by checked thresholds') : 'Not evaluated'
    return presentResult(hstsRule, page, {
      input: 'HTTP response headers', type, priority,
      values: [
        textField('Strict-Transport-Security', hstsHeader), textField('Page protocol', protocol),
        textField('max-age seconds', maxAge === null ? 'Invalid or not parsed' : maxAge),
        textField('includeSubDomains', includeSubDomains ? 'Present' : 'Not present'),
        textField('preload', preload ? 'Present' : 'Not present'),
      ],
      detailValues: [textField('Preload eligibility', eligibility)],
      checked: [
        textField('Header name', 'Strict-Transport-Security'), textField('Page protocol check', 'HTTPS or HTTP from the tested page URL'),
        textField('max-age parsing', 'One whole-second numeric declaration'), textField('includeSubDomains detection', 'Directive token, case-insensitive'),
        textField('preload detection', 'Directive token, case-insensitive'), textField('Preload threshold', `max-age at least ${PRELOAD_MIN_MAX_AGE} seconds and includeSubDomains present`),
      ],
      evidence, noMarkup: NO_MARKUP,
    })
  },
}
