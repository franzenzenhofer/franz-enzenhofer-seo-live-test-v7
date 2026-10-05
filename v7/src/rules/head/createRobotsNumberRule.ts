import { crawlerLabel, distinct, headerRows, matchedPairs, metaRecords } from './robotsPresentation'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { parseRobotsDirectives } from '@/shared/robots'
import { findRobotsTokens, parseDirectiveNumber } from '@/shared/robots-tokens'
import { listRow } from '@/shared/presentation/listRow'

type Config = { directive: 'max-snippet' | 'max-video-preview'; name: string; unit: string; zeroMeaning: string; defaultMeaning: string }
const shown = (value: string | undefined) => value || '(empty)'

export const createRobotsNumberRule = (config: Config): Rule => {
  const rule: Rule = {
    id: `head:robots-${config.directive}`,
    name: config.name,
    presentation: 1,
    enabled: true,
    what: 'static',
    meta: {
      provenance: 'google', references: [`https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#${config.directive}`],
      description: `Reports each ${config.directive} instruction with its crawler, source, numeric validity and meaning in ${config.unit}.`,
      userGuide: {
        check: `Checks the syntax of ${config.directive} instructions in robots meta tags and HTTP headers. Each setting is labelled by crawler. Google combines applicable restrictions; other crawler behavior may differ.`,
        action: `Correct the invalid ${config.directive} value in the listed tag or X-Robots-Tag header. Use a whole number of ${config.unit}, 0, or -1. Choose the intended restriction and preserve unrelated instructions.`,
      },
    },
    async run(page) {
      const headersCaptured = page.headers !== undefined || page.responseHeaderFields !== undefined
      const matches = findRobotsTokens(parseRobotsDirectives(page.doc, page.headers, page.responseHeaderFields), config.directive)
      const parsed = matches.map((match) => ({ ...match, number: parseDirectiveNumber(match.value) }))
      const invalid = parsed.filter((entry) => !entry.number.valid).length
      const pairs = matchedPairs(page.doc, parsed)
      const records = metaRecords(pairs, (pair) => {
        const entries = parsed.filter((entry) => entry.domPath === pair.directive.domPath)
        return [
          textField('Crawler', crawlerLabel(pair.directive.ua)),
          textField('Value', entries.map((entry) => shown(entry.value)).join(', ')),
          textField('Syntax', entries.every((entry) => entry.number.valid) ? 'Valid' : 'Invalid'),
        ]
      })
      const headers = headerRows(parsed.map((entry) => ({ ua: entry.ua, value: entry.token, source: entry.source })))
      const common = {
        input: headersCaptured ? 'Static DOM + HTTP response headers' : 'Static DOM',
        detailValues: [...(pairs.length ? records.counts : []), ...headers],
        checked: [
          textField('Directive', config.directive),
          textField('Header', headersCaptured ? 'X-Robots-Tag' : 'Not captured'),
          textField('Selection', 'All matches'),
          textField('Unit', config.unit),
          textField('Criterion', 'Value is a whole number of -1 or greater (-1 = no explicit maximum, 0 = maximum restriction)'),
        ],
        evidence: records.evidence,
        markup: records.markup,
        noMarkup: pairs.length ? `Complete original ${config.directive} markup not retained` : `No matching ${config.directive} element found`,
      }
      if (!matches.length) {
        return presentResult(rule, page, { ...common, type: 'info', priority: 700, values: [textField(config.directive, 'Not found')] })
      }
      return presentResult(rule, page, {
        ...common, type: invalid ? 'warn' : 'info', priority: invalid ? 240 : 700,
        values: [
          textField(config.directive, listRow(distinct(parsed.map((entry) => shown(entry.value))))),
          textField('Applies to', listRow(distinct(parsed.map((entry) => crawlerLabel(entry.ua))))),
          ...(invalid ? [textField('Invalid values', `${invalid} of ${parsed.length}`)] : []),
          ...records.overview,
        ],
      })
    },
  }
  return rule
}
