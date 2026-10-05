import { headersNotCapturedResult } from '@/rules/http/headersNotCaptured'
import { HEADER_NO_MARKUP, headerEvidence, headerRow } from '@/rules/http/observedHeader'
import { headerValue } from '@/shared/headerValue'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const format = (ageValue: number): string => ageValue === 0 ? '0 seconds'
  : ageValue < 60 ? `${ageValue} seconds`
    : ageValue < 3600 ? `${Math.floor(ageValue / 60)} minutes` : `${Math.floor(ageValue / 3600)} hours`

export const cacheDeliveryRule: Rule = {
  id: 'http:cache-delivery', name: 'Cache Delivery (Age Header)', presentation: 1, enabled: true, what: 'http',
  meta: {
    userGuide: {
      check: "Age is a cache-reported estimate in seconds since the response was generated or validated. It concerns an intermediary cache, not necessarily the browser cache or the age of the page content.",
      action: "For an invalid Age value, fix the server or CDN to send a non-negative whole number of seconds. If content seems stale, inspect cache freshness and revalidation settings; the Age value alone does not prove a problem.",
    },
    provenance: 'standard',
    references: [
      'https://www.rfc-editor.org/rfc/rfc9111.html#section-5.1',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Age',
    ],
    description: 'Reports the Age response header (info-only), interpreting its presence as evidence of shared/proxy-cache delivery and formatting the age in seconds/minutes/hours.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return headersNotCapturedResult(cacheDeliveryRule, page, 'Age')
    const ageHeader = headerValue(page.headers, 'age')
    const hasAgeHeader = ageHeader.length > 0
    const ageValue = ageHeader && /^\d+$/.test(ageHeader) && Number.isSafeInteger(Number(ageHeader)) ? Number(ageHeader) : null
    const isFromCache = hasAgeHeader && ageValue !== null
    const type = hasAgeHeader && ageValue === null ? 'warn' : 'info'
    const priority = isFromCache ? 750 : 900
    return presentResult(cacheDeliveryRule, page, {
      input: 'HTTP response headers', type, priority,
      values: [headerRow('Age', ageHeader),
        ...(hasAgeHeader ? [textField('Cache age', ageValue !== null ? format(ageValue) : 'Invalid value')] : [])],
      checked: [textField('Header', 'Age'), textField('Valid format', 'Non-negative whole number of seconds'),
        textField('Criterion', 'Informational; a valid Age header indicates shared-cache delivery, its absence proves nothing')],
      evidence: headerEvidence('Age', ageHeader),
      noMarkup: HEADER_NO_MARKUP,
    })
  },
}
