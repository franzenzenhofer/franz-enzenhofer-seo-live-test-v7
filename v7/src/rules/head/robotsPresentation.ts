import { robotsMetaPairs } from './robotsMarkup'
import type { RobotsMetaPair } from './robotsMarkup'

import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import type { DisplayField } from '@/shared/presentation/schema'

// Card vocabulary shared by the robots meta family (FORMATTING.md F3, F4, F6, F10, F12).
export const OVERVIEW_MARKUP_LIMIT = 3
const RESTRICTIVE = ['noindex', 'none', 'nofollow']

export const crawlerLabel = (ua: string): string => (ua === 'robots' ? 'all crawlers' : ua)
export const distinct = <T>(items: T[]): T[] => [...new Set(items)]
export const normalizeTokens = (tokens: string[]): string[] => distinct(tokens.map((token) => token.trim().toLowerCase()).filter(Boolean))

/** Restrictive tokens first so noindex/nofollow are never hidden behind "... n more". */
export const restrictiveFirst = (tokens: string[]): string[] => [
  ...RESTRICTIVE.filter((token) => tokens.includes(token)),
  ...tokens.filter((token) => !RESTRICTIVE.includes(token)),
]

/** The meta elements behind token matches, in match order, each once (header matches have none). */
export const matchedPairs = (doc: Document, matches: Array<{ domPath?: string }>): RobotsMetaPair[] => {
  const byPath = new Map(robotsMetaPairs(doc).map((pair) => [pair.directive.domPath, pair]))
  return distinct(matches.map((match) => (match.domPath ? byPath.get(match.domPath) : undefined))
    .filter((pair): pair is RobotsMetaPair => Boolean(pair)))
}

type Extra = (pair: RobotsMetaPair, index: number) => DisplayField[]

/** One markup field and one evidence record per robots meta element, plus the four count rows. */
export const metaRecords = (pairs: RobotsMetaPair[], extra: Extra = () => []) => {
  const { sample, total } = sampleElements(pairs.map((pair) => pair.element))
  const records = elementRecords(sample, total, (_, index) => extra(pairs[index]!, index))
  return { ...records, overview: records.markup.length <= OVERVIEW_MARKUP_LIMIT ? records.markup : [] }
}

type HeaderDirective = { ua: string; value: string; source: 'meta' | 'header' }

/** X-Robots-Tag directives as detail rows: header values are response facts, not document markup. */
export const headerRows = (directives: HeaderDirective[]): DisplayField[] => {
  const headers = directives.filter((directive) => directive.source === 'header')
  return headers.map((directive, index) => textField(
    headers.length > 1 ? `X-Robots-Tag ${index + 1}` : 'X-Robots-Tag',
    directive.ua === 'robots' ? directive.value : `${directive.ua}: ${directive.value}`,
  ))
}
