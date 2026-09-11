import { robotsMetaPairs } from './robotsMarkup'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

type Config = { id: string; name: string; crawler: 'robots' | 'googlebot'; noindexOnly?: boolean }

export const createRobotsMetaRule = (config: Config): Rule => {
  const rule: Rule = {
    id: config.id,
    name: config.name,
    presentation: 1,
    enabled: true,
    what: 'static',
    meta: {
      provenance: 'google', references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
      description: 'Reports named robots meta instructions throughout the document, with exact source tags and the meaning of noindex and nofollow.',
      userGuide: {
        check: `Checks all ${config.crawler} meta tags in the captured document, including body tags. Multiple tags combine; a permissive tag does not cancel a restriction. HTTP headers and other crawler-specific tags are checked separately.`,
        action: 'If this page should appear in search, remove the unintended noindex or none instruction from the listed template or CMS setting. Preserve intentional exclusions. Review nofollow separately: it concerns links, not whether this page can be indexed.',
      },
    },
    async run(page) {
      const pairs = robotsMetaPairs(page.doc).filter((pair) => pair.directive.ua === config.crawler)
      const directives = pairs.map((pair) => pair.directive)
      const hasNoindex = directives.some((directive) => directive.hasNoindex)
      const hasNofollow = directives.some((directive) => directive.hasNofollow)
      const restricted = hasNoindex || (!config.noindexOnly && hasNofollow)
      const { sample, total } = sampleElements(pairs.map((pair) => pair.element))
      const captured = markupEvidence(sample, `${config.crawler} meta tag`)
      return presentResult(rule, page, {
        input: 'Static DOM',
        type: restricted ? 'warn' : 'info',
        priority: restricted ? 150 : 700,
        values: [
          textField(`${config.crawler} meta tags`, directives.length),
          textField('Contains noindex', hasNoindex ? 'Yes' : 'No'),
          textField('Contains nofollow', hasNofollow ? 'Yes' : 'No'),
        ],
        detailValues: [
          textField('Meta elements retained', sample.length),
          textField('Meta elements omitted', total - sample.length),
        ],
        checked: [
          textField('Query', `meta[name="${config.crawler}" i]`),
          textField('Selection', 'All matches, including body tags'),
          textField('Source', 'HTML meta tag'),
          textField('Criterion', config.noindexOnly
            ? 'Warn when noindex or none is present (nofollow does not affect this criterion)'
            : 'Warn when noindex, nofollow or none is present'),
        ],
        evidence: [
          ...directives.slice(0, sample.length).map((directive, index) => ({
            name: `Meta ${index + 1}`,
            fields: [
              textField('Instruction', directive.value),
              textField('Contains noindex', directive.hasNoindex ? 'Yes' : 'No'),
              textField('Contains nofollow', directive.hasNofollow ? 'Yes' : 'No'),
            ],
          })),
          ...(captured.fields.length ? [{ name: 'Source locations', fields: captured.fields }] : []),
        ],
        markup: captured.markup,
        noMarkup: total ? `Complete original ${config.crawler} meta markup not retained` : `No ${config.crawler} meta element found`,
      })
    },
  }
  return rule
}
