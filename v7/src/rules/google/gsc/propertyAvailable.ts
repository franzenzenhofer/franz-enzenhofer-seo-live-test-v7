import { extractGoogleCredentials } from '../google-utils'
import { deriveGscProperty } from '../google-gsc-utils'

import { gscNoTokenFacts, gscPropertyMissingFacts, GSC_NOT_MARKUP } from './gscFacts'

import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'Search Console property access'

export const gscPropertyAvailableRule: Rule = {
  id: 'gsc:property-available',
  name: NAME,
  presentation: 1,
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
    if (!token) return presentResult(gscPropertyAvailableRule, page, gscNoTokenFacts())

    const derived = await deriveGscProperty(page.url, token)
    if (!derived) return presentResult(gscPropertyAvailableRule, page, gscPropertyMissingFacts(page.url))

    const { property, type: propertyType } = derived
    return presentResult(gscPropertyAvailableRule, page, {
      input: 'Page URL + Search Console API response',
      type: 'ok',
      priority: 800,
      values: [textField('Search Console property', property)],
      detailValues: [textField('Property type', propertyType === 'domain' ? 'Domain property' : 'URL-prefix property')],
      checked: [
        textField('Property scopes probed', 'URL-prefix property and sc-domain property for this hostname'),
        textField('Criterion', 'A property the signed-in account can query via the Search Console API'),
      ],
      noMarkup: GSC_NOT_MARKUP,
    })
  },
}
