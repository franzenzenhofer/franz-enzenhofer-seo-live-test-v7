import { robotsMetaPairs } from './robotsMarkup'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Meta other robots'
const RULE_ID = 'head:meta-other-robots'
const SELECTOR = 'meta[name] (robots vocabulary, excluding robots and googlebot)'

export const robotsOtherMetaRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: 'Lists instructions aimed at crawlers other than the generic robots group and Googlebot. A restriction for one named crawler does not automatically block Googlebot. Support for individual directives depends on that crawler.',
      action: 'Confirm which crawler each restriction targets. Change the relevant meta tag only if its noindex or nofollow instruction is unintended, and preserve the intended restrictions for other crawlers.',
    },
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Lists agent-specific robots meta tags whose name is neither robots nor googlebot, warning when any carries noindex/nofollow.',
  },
  async run(page) {
    const pairs = robotsMetaPairs(page.doc).filter(
      (pair) => pair.directive.ua !== 'robots' && pair.directive.ua !== 'googlebot',
    )
    const directives = pairs.map((pair) => pair.directive)
    const hasNoindex = directives.some((directive) => directive.hasNoindex)
    const hasNofollow = directives.some((directive) => directive.hasNofollow)
    const restricted = hasNoindex || hasNofollow
    const { sample, total } = sampleElements(pairs.map((pair) => pair.element))
    const captured = markupEvidence(sample, 'Agent-specific robots meta tag')
    return presentResult(robotsOtherMetaRule, page, {
      input: 'Static DOM',
      type: directives.length && restricted ? 'warn' : 'info',
      priority: !directives.length ? 910 : restricted ? 170 : 620,
      values: [
        textField('Agent-specific robots meta tags', directives.length),
        textField('Crawlers listed', directives.length ? directives.map((directive) => directive.ua).join('; ') : 'None'),
        textField('Contains noindex', hasNoindex ? 'Yes' : 'No'),
        textField('Contains nofollow', hasNofollow ? 'Yes' : 'No'),
      ],
      detailValues: [
        textField('Meta elements retained', sample.length),
        textField('Meta elements omitted', total - sample.length),
      ],
      checked: [
        textField('Selector', SELECTOR),
        textField('Selection', 'All matches'),
        textField('Source', 'HTML meta tag'),
        textField('Criterion', 'Warn only when a listed agent-specific instruction contains noindex or nofollow'),
      ],
      evidence: directives.map((directive, index) => ({
        name: `Meta ${index + 1}`,
        fields: [
          textField('Crawler', directive.ua),
          textField('Instruction', directive.value),
          textField('Contains noindex', directive.hasNoindex ? 'Yes' : 'No'),
          textField('Contains nofollow', directive.hasNofollow ? 'Yes' : 'No'),
        ],
      })),
      markup: captured.markup,
      noMarkup: total ? 'Complete original agent-specific robots meta markup not retained' : 'No agent-specific robots meta element found',
    })
  },
}
