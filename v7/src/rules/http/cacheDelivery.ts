import { headerValue } from '@/shared/headerValue'
import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

// Constants
const LABEL = 'HTTP'
const NAME = 'Cache Delivery (Age Header)'
const RULE_ID = 'http:cache-delivery'

export const cacheDeliveryRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
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
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    // 1. Extract Age header
    const ageHeader = headerValue(page.headers, 'age')
    const ageValue = ageHeader && /^\d+$/.test(ageHeader) && Number.isSafeInteger(Number(ageHeader)) ? Number(ageHeader) : null

    // 2. Determine states (RFC 9111 5.1: presence of Age implies a cache was
    // in the path; absence proves nothing about origin contact)
    const hasAgeHeader = ageHeader.length > 0
    const isFromCache = hasAgeHeader && ageValue !== null

    // 3. Build message (Quantified, showing value)
    let message = ''
    if (!hasAgeHeader) {
      message = 'No Age header (no evidence of shared-cache delivery)'
    } else if (ageValue === null) {
      message = 'Age header is invalid: expected a non-negative whole number of seconds.'
    } else if (ageValue === 0) {
      message = 'Age: 0 - response passed through a cache but was just generated/validated at the origin'
    } else if (ageValue < 60) {
      message = `Age: ${ageValue} seconds (From cache)`
    } else if (ageValue < 3600) {
      const minutes = Math.floor(ageValue / 60)
      message = `Age: ${minutes} minutes (From cache)`
    } else {
      const hours = Math.floor(ageValue / 3600)
      message = `Age: ${hours} hours (From cache)`
    }

    // 4. Build evidence (Chain of Evidence)
    return {
      label: LABEL,
      name: NAME,
      message,
      type: hasAgeHeader && ageValue === null ? 'warn' : 'info',
      priority: isFromCache ? 750 : 900,
      details: {
        snippet: extractSnippet(ageHeader || '(not present)'),
        ageHeader,
        ageValue,
        ageUnit: 'seconds',
        isFromCache,
      },
    }
  },
}

