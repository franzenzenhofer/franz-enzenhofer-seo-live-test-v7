import { extractGoogleCredentials, createNoTokenResult } from '../google-utils'
import { deriveGscProperty } from '../google-gsc-utils'

import type { Rule } from '@/core/types'

const NAME = 'Webproperty available'
const SPEC = 'https://developers.google.com/webmaster-tools/search-console-api-original/v3/'
const TESTED = 'Derived URL-prefix and domain properties and verified access via the Search Console API.'

export const gscPropertyAvailableRule: Rule = {
  id: 'gsc:property-available',
  name: NAME,
  enabled: true,
  what: 'gsc',
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
          tested: TESTED,
          reference: SPEC,
        },
      }
    }

    return {
      label: 'GSC',
      message: `Property available: ${property}`,
      type: 'ok',
      name: NAME,
      details: {
        url: page.url,
        property,
        propertyType,
        tested: TESTED,
        reference: SPEC,
      },
    }
  },
}
