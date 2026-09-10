import type { Rule } from '@/core/types'
import { parseRobotsDirectives } from '@/shared/robots'
import { findRobotsTokens, parseDirectiveNumber } from '@/shared/robots-tokens'

type Config = { directive: 'nosnippet' | 'noimageindex'; name: string; meaning: string; action: string }
export const createRobotsRestrictionRule = (config: Config): Rule => ({
  id: `head:robots-${config.directive}`, name: config.name, enabled: true, what: 'static',
  meta: {
    provenance: 'google', references: [`https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#${config.directive}`],
    description: `Identifies ${config.directive} restrictions by crawler and exact tag or header, with conditional remediation.`,
    userGuide: {
      check: 'Lists the requested restriction for each named crawler. These meanings follow Google’s documented behavior; a directive aimed at a different crawler does not automatically apply to Googlebot.',
      action: config.action,
    },
  },
  async run(page) {
    const directives = parseRobotsDirectives(page.doc, page.headers, page.responseHeaderFields)
    const matches = [...findRobotsTokens(directives, config.directive),
      ...(config.directive === 'nosnippet' ? findRobotsTokens(directives, 'max-snippet').filter(({ value }) => {
        const parsed = parseDirectiveNumber(value)
        return parsed.valid && parsed.value === 0
      }) : [])]
    return {
      label: 'HEAD', name: config.name, type: matches.length ? 'warn' : 'info', priority: matches.length ? 220 : 900,
      message: matches.length ? `${matches.length} instruction(s) request ${config.directive === 'nosnippet' ? 'restricted search snippets' : 'no image indexing from this page'}.`
        : `No ${config.directive === 'nosnippet' ? 'nosnippet or max-snippet:0' : 'noimageindex'} restriction found.`,
      details: { interpretation: config.meaning,
        ...(matches.length ? { restrictingInstructions: matches.map((match) => ({
          crawler: match.ua === 'robots' ? 'All crawlers' : match.ua,
          foundIn: match.source === 'meta' ? 'HTML meta tag' : 'X-Robots-Tag HTTP header',
          instruction: match.token, ...(match.sourceHtml ? { sourceHtml: match.sourceHtml } : {}),
        })) } : {}) },
    }
  },
})
