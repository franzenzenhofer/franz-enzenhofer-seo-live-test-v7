import { linkHintResult } from './linkHints'

import type { Rule } from '@/core/types'

const SELECTOR = 'link[rel="preconnect"]'

export const preconnectRule: Rule = {
  id: 'speed:preconnect',
  name: 'rel=preconnect',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "A preconnect hint asks the browser to prepare a connection to an origin before a resource needs it. This lists declared hints; it does not prove that a connection was opened or that the hint improved loading.",
      action: "Use preconnect for a small number of important origins needed early. Remove unused hints and configure crossorigin where required by the actual resource request; verify the effect in network timing.",
    },
    provenance: 'standard',
    references: [
      'https://html.spec.whatwg.org/multipage/links.html#link-type-preconnect',
      'https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect',
    ],
    description: 'Info-only count of <link rel="preconnect"> elements with their hrefs.',
  },
  async run(page) {
    return linkHintResult(preconnectRule, page, { selector: SELECTOR, countKey: 'Preconnect links', summaryKey: 'Hosts', summary: 'host', noMarkup: 'No preconnect link element found' })
  },
}
