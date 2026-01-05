import type { Rule } from '@/core/types'
import { extractSnippet, joinHtmlFragments } from '@/shared/html-utils'
import { parseRobotsDirectives } from '@/shared/robots'
import { findRobotsTokens, parseDirectiveNumber } from '@/shared/robots-tokens'

const LABEL = 'HEAD'
const NAME = 'Robots max-video-preview'
const RULE_ID = 'head:robots-max-video-preview'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#max-video-preview'

export const robotsMaxVideoPreviewRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const directives = parseRobotsDirectives(page.doc, page.headers)
    const matches = findRobotsTokens(directives, 'max-video-preview')
    if (matches.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No max-video-preview directive found.',
        type: 'info',
        priority: 905,
        details: { reference: SPEC },
      }
    }

    const parsed = matches.map((match) => ({ match, parsed: parseDirectiveNumber(match.value) }))
    const invalid = parsed.filter((entry) => !entry.parsed.valid)
    const summary = parsed.map((entry) => `${entry.match.ua}:${entry.match.token}`).join('; ')
    const sourceHtml = joinHtmlFragments(matches.map((m) => m.sourceHtml).filter((html): html is string => Boolean(html)))
    const snippet = sourceHtml ? extractSnippet(sourceHtml) : extractSnippet(summary || '(not present)')
    const domPaths = matches.map((m) => m.domPath).filter((path): path is string => Boolean(path))
    const message = invalid.length
      ? `Invalid max-video-preview values: ${invalid.map((entry) => entry.match.token).join(', ')}.`
      : `max-video-preview set: ${parsed.map((entry) => entry.parsed.raw).join(', ')}.`
    return {
      label: LABEL,
      name: NAME,
      message,
      type: invalid.length ? 'warn' : 'info',
      priority: invalid.length ? 240 : 700,
      details: {
        sourceHtml,
        snippet,
        domPaths,
        matches,
        parsed: parsed.map((entry) => ({ ...entry.match, ...entry.parsed })),
        reference: SPEC,
      },
    }
  },
}
