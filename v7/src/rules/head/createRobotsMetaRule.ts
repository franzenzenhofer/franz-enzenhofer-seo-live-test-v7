import { robotsMetaPairs } from './robotsMarkup'
import { crawlerLabel, metaRecords, normalizeTokens, restrictiveFirst } from './robotsPresentation'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { listRow } from '@/shared/presentation/listRow'

type Config = { id: string; name: string; crawler: 'robots' | 'googlebot'; noindexOnly?: boolean }
const LABEL = { robots: 'Robots', googlebot: 'Googlebot' } as const

export const createRobotsMetaRule = (config: Config): Rule => {
  const checked = [
    textField('Query', `meta[name="${config.crawler}" i]`),
    textField('Selection', 'All matches, including body tags'),
    textField('Source', 'HTML meta tag'),
    textField('Criterion', config.noindexOnly
      ? 'Warn when noindex or none is present (nofollow does not affect this criterion)'
      : 'Warn when noindex, nofollow or none is present'),
  ]
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
      if (!pairs.length) {
        return presentResult(rule, page, {
          input: 'Static DOM', type: 'info', priority: 700,
          values: [textField(`${LABEL[config.crawler]} meta`, 'Not found')], checked,
          noMarkup: `No ${config.crawler} meta element found`,
        })
      }
      const records = metaRecords(pairs, (pair) => [textField('Instruction', pair.directive.value)])
      const tokens = restrictiveFirst(normalizeTokens(directives.flatMap((directive) => directive.tokens)))
      return presentResult(rule, page, {
        input: 'Static DOM',
        type: restricted ? 'warn' : 'info',
        priority: restricted ? 150 : 700,
        values: [
          ...(pairs.length > 1 ? [textField(`${config.crawler} meta tags`, pairs.length)] : []),
          textField(pairs.length > 1 ? 'Instructions' : 'Instruction', listRow(tokens)),
          textField('Applies to', crawlerLabel(config.crawler)),
          ...records.overview,
        ],
        detailValues: records.counts,
        checked,
        evidence: records.evidence,
        markup: records.markup,
        noMarkup: `Complete original ${config.crawler} meta markup not retained`,
      })
    },
  }
  return rule
}
