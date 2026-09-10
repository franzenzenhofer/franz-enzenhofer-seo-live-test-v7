import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty, createGscPropertyDerivationFailedResult } from '../google-gsc-utils'

import type { Rule } from '@/core/types'

const NAME = 'Search Console property access'

export const gscPropertyAvailableRule: Rule = {
  id: 'gsc:property-available',
  name: NAME,
  enabled: true,
  what: 'gsc',
  meta: {
    userGuide: {
      check: "Looks for a Search Console property covering this URL that the signed-in account can query. A domain property covers protocols and subdomains; a URL-prefix property covers its URL prefix. Results may come from a recent access probe.",
      action: "Check the displayed property in Search Console. If it is unavailable, verify account access before creating another property.",
    },
    provenance: 'franz',
    references: [
      'https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect',
    ],
    description: 'Verifies the signed-in Google account has a Search Console property (URL-prefix or sc-domain) covering the tested URL.',
  },
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult('GSC', NAME)

    const derived = await deriveGscProperty(page.url, token)
    const { property, type: propertyType } = derived || {}

    if (!derived) return createGscPropertyDerivationFailedResult(page.url, NAME)

    return {
      label: 'GSC',
      message: `Property available: ${property}`,
      type: 'ok',
      priority: 800,
      name: NAME,
      details: {
        url: page.url,
        value: property,
        property,
        propertyType,
      },
    }
  },
}
