/**
 * Google Search Console specific utilities
 * Auto-derives GSC property from test URL
 */

import { GSC_API_REFERENCE } from './google-utils'
import { deriveGscProperty, GSC_PROBE_TIMEOUT_MS, type GscProperty } from './gscProperty'

export { deriveGscProperty, GSC_PROBE_TIMEOUT_MS }
export type { GscProperty }

export const createGscPropertyDerivationFailedResult = (url: string, name = 'Search Console access') => ({
  label: 'GSC',
  message: 'Could not confirm access to a Search Console property for this page.',
  type: 'runtime_error' as const,
  name,
  priority: -1000,
  details: {
    url,
    meaning: 'The property probe failed or returned no accessible match. This does not prove that the site has no Search Console property.',
    nextStep: 'Open Search Console with the same Google account and check access to a property covering this URL. If needed, ask the owner for access. Reconnect in Settings > Google Account and rerun after access or network problems are resolved.',
    scope: 'Automatic matching checks the origin URL-prefix and a domain property inferred from the hostname. Other property scopes may not be discovered. Probe results can be cached for up to 30 minutes.',
    reference: GSC_API_REFERENCE,
  },
})
