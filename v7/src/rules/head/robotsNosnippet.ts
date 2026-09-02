import type { Rule } from '@/core/types'
import { extractSnippet, joinHtmlFragments } from '@/shared/html-utils'
import { parseRobotsDirectives } from '@/shared/robots'
import { findRobotsTokens, parseDirectiveNumber } from '@/shared/robots-tokens'

const LABEL = 'HEAD'
const NAME = 'Robots nosnippet'
const RULE_ID = 'head:robots-nosnippet'

const summary = (tokens: { ua: string; token: string }[]) => tokens.map((t) => `${t.ua}:${t.token}`).join('; ')

export const robotsNosnippetRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#nosnippet',
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#max-snippet',
    ],
    description: 'Warns when snippets are disabled via a nosnippet directive or max-snippet:0 in robots meta tags or X-Robots-Tag.',
  },
  async run(page) {
    const directives = parseRobotsDirectives(page.doc, page.headers)
    const nosnippetMatches = findRobotsTokens(directives, 'nosnippet')
    const maxSnippetMatches = findRobotsTokens(directives, 'max-snippet')
    const zeroSnippet = maxSnippetMatches.filter((match) => {
      const parsed = parseDirectiveNumber(match.value)
      return parsed.valid && parsed.value === 0
    })
    const matches = [...nosnippetMatches, ...zeroSnippet]
    if (matches.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No nosnippet directive found.',
        type: 'info',
        priority: 900,
      }
    }

    const sourceHtml = joinHtmlFragments(matches.map((m) => m.sourceHtml).filter((html): html is string => Boolean(html)))
    const matchSummary = summary(matches)
    const snippet = sourceHtml ? extractSnippet(sourceHtml) : extractSnippet(matchSummary || '(not present)')
    const domPaths = matches.map((m) => m.domPath).filter((path): path is string => Boolean(path))
    return {
      label: LABEL,
      name: NAME,
      message: `Snippet disabled via nosnippet/max-snippet:0 (${matchSummary}).`,
      type: 'warn',
      priority: 200,
      details: {
        sourceHtml,
        snippet,
        domPaths,
        matches,
      },
    }
  },
}
