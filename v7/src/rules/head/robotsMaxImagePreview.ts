import { robotsMetaPairs } from './robotsMarkup'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { parseRobotsDirectives } from '@/shared/robots'
import { findRobotsTokens } from '@/shared/robots-tokens'

const NAME = 'Robots max-image-preview'
const RULE_ID = 'head:robots-max-image-preview'
const ALLOWED = new Set(['none', 'standard', 'large'])

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
    const matches = findRobotsTokens(directives, 'max-image-preview')
    const parsed = matches.map((match) => {
      const value = (match.value || '').trim().toLowerCase()
      return { ...match, value, valid: ALLOWED.has(value) }
    })
    const invalid = parsed.filter((entry) => !entry.valid)
    const elementByPath = new Map(robotsMetaPairs(page.doc).map((pair) => [pair.directive.domPath, pair.element]))
    const elements = parsed
      .map((entry) => (entry.domPath ? elementByPath.get(entry.domPath) : undefined))
      .filter((element): element is Element => Boolean(element))
    const { sample, total } = sampleElements(elements)
    const captured = markupEvidence(sample, 'max-image-preview tag')
    return presentResult(robotsMaxImagePreviewRule, page, {
      input: headersCaptured ? 'Static DOM + HTTP response headers' : 'Static DOM',
      type: invalid.length ? 'warn' : 'info',
      priority: !matches.length ? 905 : invalid.length ? 240 : 700,
      values: [
        textField('max-image-preview directives', matches.length),
        textField('Invalid values', invalid.length),
      ],
      detailValues: [
        textField('Allowed values', Array.from(ALLOWED).join(', ')),
        textField('Elements retained', sample.length),
        textField('Elements omitted', total - sample.length),
      ],
      checked: [
        textField('Directive', 'max-image-preview'),
        textField('Header', headersCaptured ? 'X-Robots-Tag' : 'Not captured'),
        textField('Selection', 'All matches'),
        textField('Criterion', 'Value is one of none, standard, large'),
      ],
      evidence: parsed.map((entry, index) => ({
        name: `Instruction ${index + 1}`,
        fields: [
          textField('Crawler', entry.ua === 'robots' ? 'All crawlers (including Googlebot)' : entry.ua),
          textField('Source', entry.source === 'meta' ? 'HTML meta tag' : 'HTTP response header'),
          textField('Value', entry.value || '(empty)'),
          textField('Valid', entry.valid ? 'Yes' : 'No'),
          ...(entry.headerKey ? [textField('Header name', entry.headerKey)] : []),
        ],
      })),
      markup: captured.markup,
      noMarkup: total ? 'Complete original max-image-preview markup not retained' : 'No matching max-image-preview element found',
    })
  },
}
