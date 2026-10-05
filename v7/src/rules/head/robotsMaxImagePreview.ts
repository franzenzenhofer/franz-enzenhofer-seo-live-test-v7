import { crawlerLabel, distinct, headerRows, matchedPairs, metaRecords } from './robotsPresentation'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { parseRobotsDirectives } from '@/shared/robots'
import { findRobotsTokens } from '@/shared/robots-tokens'
import { listRow } from '@/shared/presentation/listRow'

const NAME = 'Robots max-image-preview'
const RULE_ID = 'head:robots-max-image-preview'
const DIRECTIVE = 'max-image-preview'
const ALLOWED = new Set(['none', 'standard', 'large'])
const shown = (value: string) => value || '(empty)'

export const robotsMaxImagePreviewRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#max-image-preview'],
    description: 'Reports max-image-preview directives and warns when the value is not one of none/standard/large.',
  },
  async run(page) {
    const headersCaptured = page.headers !== undefined || page.responseHeaderFields !== undefined
    const directives = parseRobotsDirectives(page.doc, page.headers, page.responseHeaderFields)
    const parsed = findRobotsTokens(directives, DIRECTIVE).map((match) => {
      const value = (match.value || '').trim().toLowerCase()
      return { ...match, value, valid: ALLOWED.has(value) }
    })
    const invalid = parsed.filter((entry) => !entry.valid).length
    const pairs = matchedPairs(page.doc, parsed)
    const records = metaRecords(pairs, (pair) => {
      const entries = parsed.filter((entry) => entry.domPath === pair.directive.domPath)
      return [
        textField('Crawler', crawlerLabel(pair.directive.ua)),
        textField('Value', entries.map((entry) => shown(entry.value)).join(', ')),
        textField('Syntax', entries.every((entry) => entry.valid) ? 'Valid' : 'Invalid'),
      ]
    })
    const headers = headerRows(parsed.map((entry) => ({ ua: entry.ua, value: entry.token, source: entry.source })))
    const common = {
      input: headersCaptured ? 'Static DOM + HTTP response headers' : 'Static DOM',
      detailValues: [...(pairs.length ? records.counts : []), ...headers],
      checked: [
        textField('Directive', DIRECTIVE),
        textField('Header', headersCaptured ? 'X-Robots-Tag' : 'Not captured'),
        textField('Selection', 'All matches'),
        textField('Criterion', 'Value is one of none, standard, large'),
      ],
      evidence: records.evidence,
      markup: records.markup,
      noMarkup: pairs.length ? 'Complete original max-image-preview markup not retained' : 'No matching max-image-preview element found',
    }
    if (!parsed.length) {
      return presentResult(robotsMaxImagePreviewRule, page, { ...common, type: 'info', priority: 905, values: [textField(DIRECTIVE, 'Not found')] })
    }
    return presentResult(robotsMaxImagePreviewRule, page, {
      ...common, type: invalid ? 'warn' : 'info', priority: invalid ? 240 : 700,
      values: [
        textField(DIRECTIVE, listRow(distinct(parsed.map((entry) => shown(entry.value))))),
        textField('Applies to', listRow(distinct(parsed.map((entry) => crawlerLabel(entry.ua))))),
        ...(invalid ? [textField('Invalid values', `${invalid} of ${parsed.length}`)] : []),
        ...records.overview,
      ],
    })
  },
}
