import type { Rule } from '@/core/types'
import { extractSnippet, joinHtmlFragments } from '@/shared/html-utils'
import { parseRobotsDirectives } from '@/shared/robots'
import { findRobotsTokens } from '@/shared/robots-tokens'

const LABEL = 'HEAD'
const NAME = 'Robots noimageindex'
const RULE_ID = 'head:robots-noimageindex'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#noimageindex'

const summary = (tokens: { ua: string; token: string }[]) => tokens.map((t) => `${t.ua}:${t.token}`).join('; ')

export const robotsNoImageIndexRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const directives = parseRobotsDirectives(page.doc, page.headers)
    const matches = findRobotsTokens(directives, 'noimageindex')
    if (matches.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No noimageindex directive found.',
        type: 'info',
        priority: 900,
        details: { reference: SPEC },
      }
    }

    const sourceHtml = joinHtmlFragments(matches.map((m) => m.sourceHtml).filter((html): html is string => Boolean(html)))
    const matchSummary = summary(matches)
    const snippet = sourceHtml ? extractSnippet(sourceHtml) : extractSnippet(matchSummary || '(not present)')
    const domPaths = matches.map((m) => m.domPath).filter((path): path is string => Boolean(path))
    return {
      label: LABEL,
      name: NAME,
      message: `Image indexing disabled via noimageindex (${matchSummary}).`,
      type: 'warn',
      priority: 220,
      details: {
        sourceHtml,
        snippet,
        domPaths,
        matches,
        reference: SPEC,
      },
    }
  },
}
