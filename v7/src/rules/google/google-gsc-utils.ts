/**
 * Google Search Console specific utilities
 * Auto-derives GSC property from test URL
 */

import { GSC_API_REFERENCE } from './google-utils'
import { deriveGscProperty, GSC_PROBE_TIMEOUT_MS, type GscProperty } from './gscProperty'

export { deriveGscProperty, GSC_PROBE_TIMEOUT_MS }
export type { GscProperty }

export const createGscPropertyDerivationFailedResult = (url: string) => {
  const parsedUrl = new URL(url)
  const domain = parsedUrl.hostname.replace(/^www\./, '')
  return {
    label: 'GSC',
    message: `No GSC property access for ${parsedUrl.hostname}. Add property in Search Console.`,
    type: 'runtime_error' as const,
    name: 'googleRule',
    priority: -1000,
    details: {
      url,
      hostname: parsedUrl.hostname,
      triedUrlPrefix: `${parsedUrl.origin}/`,
      triedDomain: `sc-domain:${domain}`,
      reference: GSC_API_REFERENCE
    }
  }
}
