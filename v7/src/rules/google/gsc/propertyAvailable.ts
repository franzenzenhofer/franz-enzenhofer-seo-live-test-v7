import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty } from '../google-gsc-utils'

import type { Rule } from '@/core/types'

const NAME = 'Webproperty available'

export const gscPropertyAvailableRule: Rule = {
  id: 'gsc:property-available',
  name: NAME,
  enabled: true,
  what: 'gsc',
  meta: {
    provenance: 'franz',
    references: [
      'https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect',
    ],
    description: 'Verifies the signed-in Google account has a Search Console property (URL-prefix or sc-domain) covering the tested URL.',
  },
  async run(page, ctx) {
    const { token } = extractGoogleCredentials(ctx)
    if (!token) return createNoTokenResult()

    const derived = await deriveGscProperty(page.url, token)
    const { property, type: propertyType } = derived || {}

    if (!derived) {
      const parsedUrl = new URL(page.url)
      const domain = parsedUrl.hostname.replace(/^www\./, '')
      return {
        label: 'GSC',
        message: `No GSC property access for ${parsedUrl.hostname}. Add property in Search Console.`,
        type: 'runtime_error',
        name: NAME,
        priority: -1000,
        details: {
          url: page.url,
          hostname: parsedUrl.hostname,
          triedUrlPrefix: `${parsedUrl.origin}/`,
          triedDomain: `sc-domain:${domain}`,
        },
      }
    }

    return {
      label: 'GSC',
      message: `Property available: ${property}`,
      type: 'ok',
      priority: 800,
      name: NAME,
      details: {
        url: page.url,
        property,
        propertyType,
      },
    }
  },
}
