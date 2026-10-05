import { headersNotCapturedResult } from '@/rules/http/headersNotCaptured'
import { HEADER_NO_MARKUP, headerEvidence, headerRow } from '@/rules/http/observedHeader'
import { headerValue } from '@/shared/headerValue'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

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
    if (!hasHeaders(page.headers)) return headersNotCapturedResult(hstsRule, page, 'Strict-Transport-Security')
    const hstsHeader = headerValue(page.headers, 'strict-transport-security')
    const hasHsts = Boolean(hstsHeader)
    const protocol = isHttpsUrl(page.url) ? 'HTTPS' : 'HTTP'
    const input = 'HTTP response headers + Page URL'
    const evidence = headerEvidence('Strict-Transport-Security', hstsHeader)
    const checked = [textField('Header name', 'Strict-Transport-Security'), textField('Header lookup', 'Case-insensitive'),
      textField('Page protocol check', 'HTTPS or HTTP from the tested page URL'), textField('Header applicability', 'HTTPS response')]
    if (!hasHsts) {
      const https = protocol === 'HTTPS'
      return presentResult(hstsRule, page, {
        input, type: https ? 'warn' : 'info', priority: https ? 300 : 900,
        values: [headerRow('HSTS', hstsHeader), textField('Page protocol', protocol)],
        checked, evidence, noMarkup: HEADER_NO_MARKUP,
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
    const eligibility = preload ? (preloadEligible ? 'Eligible' : 'Ineligible') : 'Not checked'
    return presentResult(hstsRule, page, {
      input, type, priority,
      values: [headerRow('HSTS', hstsHeader), textField('Page protocol', protocol), textField('max-age seconds', maxAge === null ? 'Invalid' : maxAge)],
      detailValues: [
        textField('includeSubDomains', includeSubDomains ? 'Declared' : 'Not declared'),
        textField('preload', preload ? 'Declared' : 'Not declared'),
        textField('Preload eligibility', eligibility),
      ],
      checked: [
        ...checked, textField('max-age parsing', 'One whole-second numeric declaration'),
        textField('Directive detection', 'includeSubDomains and preload tokens, case-insensitive'),
        textField('Preload threshold', `max-age at least ${PRELOAD_MIN_MAX_AGE} seconds and includeSubDomains declared`),
      ],
      evidence, noMarkup: HEADER_NO_MARKUP,
    })
  },
}
