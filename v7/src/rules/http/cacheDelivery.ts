import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

// Constants
const LABEL = 'HTTP'
const NAME = 'Cache Delivery (Age Header)'
const RULE_ID = 'http:cache-delivery'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Age'

export const cacheDeliveryRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    // 1. Extract Age header
    const ageHeader = page.headers?.['age'] || ''
    const ageValue = Number(ageHeader || '0')

    // 2. Determine states (Binary Logic)
    const hasAgeHeader = ageHeader.length > 0
    const isFromCache = hasAgeHeader && ageValue > 0

    // 3. Build message (Quantified, showing value)
    let message = ''
    if (!hasAgeHeader) {
      message = 'No Age header. (Not served from cache)'
    } else if (ageValue === 0) {
      message = 'Age: 0 seconds (Fresh from origin)'
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
      type: 'info',
      priority: isFromCache ? 750 : 900,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(ageHeader || '(not present)'),
        ageHeader,
        ageValue,
        isFromCache,
        reference: SPEC,
      },
    }
  },
}

