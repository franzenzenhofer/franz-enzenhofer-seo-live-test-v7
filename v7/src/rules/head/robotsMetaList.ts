import { robotsMetaPairs } from './robotsMarkup'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Robots meta list'
const RULE_ID = 'head:robots-meta-list'
const SELECTOR = 'meta[name] (robots vocabulary)'

export const robotsMetaListRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: 'Lists recognized robots meta instructions by crawler and their original HTML. This is an inventory, not a judgment of actual indexing. Missing meta tags do not imply that robots.txt or HTTP-header restrictions are absent.',
      action: 'Review each crawler\'s instructions in the page template or CMS robots settings. Use the indexing and preview rules to assess the combined effect before changing anything.',
    },
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Info-only inventory listing every meta-source robots directive (all user agents) found in the document.',
  },
  async run(page) {
    const pairs = robotsMetaPairs(page.doc)
    const directives = pairs.map((pair) => pair.directive)
    const { sample, total } = sampleElements(pairs.map((pair) => pair.element))
    const captured = markupEvidence(sample, 'Robots meta tag')
    const summary = directives.map((directive) => directive.ua).join('; ')
    return presentResult(robotsMetaListRule, page, {
      input: 'Static DOM',
      type: 'info',
      priority: directives.length ? 640 : 915,
      values: [
        textField('Robots meta tags', directives.length),
        textField('Crawlers listed', directives.length ? summary : 'None'),
      ],
      detailValues: [
        textField('Meta elements retained', sample.length),
        textField('Meta elements omitted', total - sample.length),
      ],
      checked: [
        textField('Selector', SELECTOR),
        textField('Selection', 'All matches'),
        textField('Source', 'HTML meta tag'),
        textField('Criterion', 'Informational inventory - no pass or fail verdict'),
      ],
      evidence: directives.map((directive, index) => ({
        name: `Meta ${index + 1}`,
        fields: [
          textField('Crawler', directive.ua === 'robots' ? 'All crawlers (including Googlebot)' : directive.ua),
          textField('Instruction', directive.value),
        ],
      })),
      markup: captured.markup,
      noMarkup: total ? 'Complete original robots meta markup not retained' : 'No robots meta element found',
    })
  },
}
