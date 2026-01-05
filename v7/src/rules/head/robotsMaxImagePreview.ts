import type { Rule } from '@/core/types'
import { extractSnippet, joinHtmlFragments } from '@/shared/html-utils'
import { parseRobotsDirectives } from '@/shared/robots'
import { findRobotsTokens } from '@/shared/robots-tokens'

const LABEL = 'HEAD'
const NAME = 'Robots max-image-preview'
const RULE_ID = 'head:robots-max-image-preview'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#max-image-preview'
const ALLOWED = new Set(['none', 'standard', 'large'])

export const robotsMaxImagePreviewRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const directives = parseRobotsDirectives(page.doc, page.headers)
    const matches = findRobotsTokens(directives, 'max-image-preview')
    if (matches.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No max-image-preview directive found.',
        type: 'info',
        priority: 905,
        details: { reference: SPEC },
      }
    }

    const parsed = matches.map((match) => {
      const value = (match.value || '').trim().toLowerCase()
      return { ...match, value, valid: ALLOWED.has(value) }
    })
    const invalid = parsed.filter((entry) => !entry.valid)
    const summary = parsed.map((entry) => `${entry.ua}:${entry.token}`).join('; ')
    const sourceHtml = joinHtmlFragments(matches.map((m) => m.sourceHtml).filter((html): html is string => Boolean(html)))
    const snippet = sourceHtml ? extractSnippet(sourceHtml) : extractSnippet(summary || '(not present)')
    const domPaths = matches.map((m) => m.domPath).filter((path): path is string => Boolean(path))
    const message = invalid.length
      ? `Invalid max-image-preview values: ${invalid.map((entry) => entry.value || '(empty)').join(', ')}.`
      : `max-image-preview set: ${parsed.map((entry) => entry.value || '(empty)').join(', ')}.`

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
        parsed,
        allowedValues: Array.from(ALLOWED),
        reference: SPEC,
      },
    }
  },
}
