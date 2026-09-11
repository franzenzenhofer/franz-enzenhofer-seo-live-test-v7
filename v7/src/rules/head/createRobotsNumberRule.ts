import { robotsMetaPairs } from './robotsMarkup'

import type { Rule } from '@/core/types'
import { EVIDENCE_LIMIT, sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { parseRobotsDirectives } from '@/shared/robots'
import { findRobotsTokens, parseDirectiveNumber } from '@/shared/robots-tokens'

type Config = { directive: 'max-snippet' | 'max-video-preview'; name: string; unit: string; zeroMeaning: string; defaultMeaning: string }

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
      const elementByPath = new Map(robotsMetaPairs(page.doc).map((pair) => [pair.directive.domPath, pair.element]))
      const elements = parsed
        .map((entry) => (entry.domPath ? elementByPath.get(entry.domPath) : undefined))
        .filter((element): element is Element => Boolean(element))
      const { sample, total } = sampleElements([...new Set(elements)])
      const captured = markupEvidence(sample, `${config.directive} tag`)
      return presentResult(rule, page, {
        input: headersCaptured ? 'Static DOM + HTTP response headers' : 'Static DOM',
        type: invalid ? 'warn' : 'info',
        priority: invalid ? 240 : 700,
        values: [
          textField(`${config.directive} directives`, matches.length),
          textField('Invalid values', invalid),
        ],
        detailValues: [
          textField('Elements retained', sample.length),
          textField('Elements omitted', total - sample.length),
          textField('Instructions retained', Math.min(parsed.length, EVIDENCE_LIMIT)),
          textField('Instructions omitted', Math.max(parsed.length - EVIDENCE_LIMIT, 0)),
        ],
        checked: [
          textField('Directive', config.directive),
          textField('Header', headersCaptured ? 'X-Robots-Tag' : 'Not captured'),
          textField('Selection', 'All matches'),
          textField('Unit', config.unit),
          textField('Criterion', 'Value is a whole number of -1 or greater (-1 = no explicit maximum, 0 = maximum restriction)'),
        ],
        evidence: [
          ...parsed.slice(0, EVIDENCE_LIMIT).map((entry, index) => ({
            name: `Instruction ${index + 1}`,
            fields: [
              textField('Crawler', entry.ua === 'robots' ? 'All crawlers (including Googlebot)' : entry.ua),
              textField('Source', entry.source === 'meta' ? 'HTML meta tag' : 'HTTP response header'),
              textField('Value', entry.value || '(empty)'),
              textField('Valid', entry.number.valid ? 'Yes' : 'No'),
              ...(entry.headerKey ? [textField('Header name', entry.headerKey)] : []),
            ],
          })),
          ...(captured.fields.length ? [{ name: 'Source locations', fields: captured.fields }] : []),
        ],
        markup: captured.markup,
        noMarkup: total ? `Complete original ${config.directive} markup not retained` : `No matching ${config.directive} element found`,
      })
    },
  }
  return rule
}
