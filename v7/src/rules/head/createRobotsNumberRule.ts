import type { Rule } from '@/core/types'
import { parseRobotsDirectives } from '@/shared/robots'
import { findRobotsTokens, parseDirectiveNumber } from '@/shared/robots-tokens'

type Config = { directive: 'max-snippet' | 'max-video-preview'; name: string; unit: string; zeroMeaning: string; defaultMeaning: string }
export const createRobotsNumberRule = (config: Config): Rule => ({
  id: `head:robots-${config.directive}`, name: config.name, enabled: true, what: 'static',
  meta: {
    provenance: 'google', references: [`https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#${config.directive}`],
    description: `Reports each ${config.directive} instruction with its crawler, source, numeric validity and meaning in ${config.unit}.`,
    userGuide: {
      check: `Checks the syntax of ${config.directive} instructions in robots meta tags and HTTP headers. Each setting is labelled by crawler. Google combines applicable restrictions; other crawler behavior may differ.`,
      action: `Correct the invalid ${config.directive} value in the listed tag or X-Robots-Tag header. Use a whole number of ${config.unit}, 0, or -1. Choose the intended restriction and preserve unrelated instructions.`,
    },
  },
  async run(page) {
    const matches = findRobotsTokens(parseRobotsDirectives(page.doc, page.headers, page.responseHeaderFields), config.directive)
    const limits = matches.map((match) => {
      const parsed = parseDirectiveNumber(match.value)
      const meaning = !parsed.valid ? 'Invalid value: expected a whole number greater than or equal to -1.'
        : parsed.value === -1 ? 'No explicit maximum from this instruction.'
          : parsed.value === 0 ? config.zeroMeaning : `Maximum ${parsed.value} ${config.unit}.`
      return { crawler: match.ua === 'robots' ? 'All crawlers' : match.ua,
        foundIn: match.source === 'meta' ? 'HTML meta tag' : 'X-Robots-Tag HTTP header',
        instruction: match.token, meaning, validValue: parsed.valid,
        ...(match.sourceHtml ? { sourceHtml: match.sourceHtml } : {}) }
    })
    const invalid = limits.filter(({ validValue }) => !validValue).length
    return {
      label: 'HEAD', name: config.name, type: invalid ? 'warn' : 'info', priority: invalid ? 240 : 700,
      message: invalid ? `${invalid} ${config.directive} instruction(s) contain an invalid value.`
        : limits.length ? `${limits.length} ${config.directive} setting(s) found; their meanings are listed below.`
          : `No ${config.directive} instruction found.`,
      details: { interpretation: config.defaultMeaning,
        ...(limits.length ? { declaredLimits: limits } : {}) },
    }
  },
})
