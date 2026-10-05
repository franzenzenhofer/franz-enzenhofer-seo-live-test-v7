import { linkHintResult } from './linkHints'

import type { Rule } from '@/core/types'

const SELECTOR = 'link[rel="dns-prefetch"]'

export const dnsPrefetchRule: Rule = {
  id: 'speed:dns-prefetch',
  name: 'rel=dns-prefetch',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "A dns-prefetch hint asks the browser to look up a hostname early. The listed URLs are hints, not proof of faster loading. No hints can be appropriate when the page has no useful third-party connections to prepare.",
      action: "Add hints only for hostnames the page is likely to use, and measure whether they help. Remove stale hints when the corresponding service is no longer used.",
    },
    provenance: 'standard',
    references: ['https://html.spec.whatwg.org/multipage/links.html#link-type-dns-prefetch'],
    description: 'Info-only count of <link rel="dns-prefetch"> elements with their target hrefs.',
  },
  async run(page) {
    return linkHintResult(dnsPrefetchRule, page, { selector: SELECTOR, countKey: 'DNS-prefetch links', summaryKey: 'Hosts', summary: 'host', noMarkup: 'No dns-prefetch link element found' })
  },
}
