import { linkHintResult } from './linkHints'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'

const SELECTOR = 'link[rel="preload"]'

export const linkPreloadRule: Rule = {
  id: 'speed:link-preload',
  name: 'rel=preload links',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "A preload hint asks the browser to fetch a resource early. The URLs below show what the page requests. This presence check does not validate the as/type/crossorigin settings or prove the preloaded resource is used.",
      action: "Preload only resources needed soon that are otherwise discovered late. Match the actual URL, resource type and request credentials; remove unused or duplicate preloads and measure the effect.",
    },
    provenance: 'standard',
    references: [
      'https://html.spec.whatwg.org/multipage/links.html#link-type-preload',
      'https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preload',
    ],
    description: 'Info-only count of <link rel="preload"> elements with their hrefs.',
  },
  async run(page) {
    return linkHintResult(linkPreloadRule, page, { selector: SELECTOR, countKey: 'Preload links', summaryKey: 'Hrefs', summary: 'url',
      extra: (element) => [textField('as', element.getAttribute('as') || 'Not declared')], noMarkup: 'No preload link element found' })
  },
}
