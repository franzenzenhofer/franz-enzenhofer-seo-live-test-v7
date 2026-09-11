import { robotsMetaPairs } from './robotsMarkup'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import {pathField, textField} from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { parseRobotsDirectives } from '@/shared/robots'
import { findRobotsTokens, parseDirectiveNumber } from '@/shared/robots-tokens'

type Config = { directive: 'nosnippet' | 'noimageindex'; name: string; meaning: string; action: string }

export const createRobotsRestrictionRule = (config: Config): Rule => {
  const rule: Rule = {
    id: `head:robots-${config.directive}`,
    name: config.name,
    presentation: 1,
    enabled: true,
    what: 'static',
    meta: {
      provenance: 'google', references: [`https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#${config.directive}`],
      description: `Identifies ${config.directive} restrictions by crawler and exact tag or header, with conditional remediation.`,
      userGuide: {
        check: 'Lists the requested restriction for each named crawler. These meanings follow Google’s documented behavior; a directive aimed at a different crawler does not automatically apply to Googlebot.',
        action: config.action,
      },
    },
    async run(page) {
      const headersCaptured = page.headers !== undefined || page.responseHeaderFields !== undefined
      const directives = parseRobotsDirectives(page.doc, page.headers, page.responseHeaderFields)
      const matches = [...findRobotsTokens(directives, config.directive),
        ...(config.directive === 'nosnippet' ? findRobotsTokens(directives, 'max-snippet').filter(({ value }) => {
          const parsed = parseDirectiveNumber(value)
          return parsed.valid && parsed.value === 0
        }) : [])]
      const elementByPath = new Map(robotsMetaPairs(page.doc).map((pair) => [pair.directive.domPath, pair.element]))
      const elements = [...new Set(matches
        .map((match) => (match.domPath ? elementByPath.get(match.domPath) : undefined))
        .filter((element): element is Element => Boolean(element)))]
      const { sample, total } = sampleElements(elements)
      const captured = markupEvidence(sample, `${config.directive} tag`)
      return presentResult(rule, page, {
        input: headersCaptured ? 'Static DOM + HTTP response headers' : 'Static DOM',
        type: matches.length ? 'warn' : 'info',
        priority: matches.length ? 220 : 900,
        values: [textField(`${config.directive} restrictions`, matches.length)],
        detailValues: [
          textField('Elements retained', sample.length),
          textField('Elements omitted', total - sample.length),
        ],
        checked: [
          textField('Directive', config.directive),
          textField('Header', headersCaptured ? 'X-Robots-Tag' : 'Not captured'),
          textField('Selection', 'All matches'),
          textField('Criterion', config.directive === 'nosnippet' ? 'nosnippet or max-snippet:0 present' : 'noimageindex present'),
        ],
        evidence: matches.map((match, index) => ({
          name: `Instruction ${index + 1}`,
          fields: [
            textField('Crawler', match.ua === 'robots' ? 'All crawlers (including Googlebot)' : match.ua),
            textField('Source', match.source === 'meta' ? 'HTML meta tag' : 'HTTP response header'),
            textField('Instruction', match.token),
            ...(match.domPath ? [pathField('DOM path', match.domPath)] : []),
            ...(match.headerKey ? [textField('Header name', match.headerKey)] : []),
          ],
        })),
        markup: captured.markup,
        noMarkup: total ? `Complete original ${config.directive} markup not retained` : `No matching ${config.directive} element found`,
      })
    },
  }
  return rule
}
