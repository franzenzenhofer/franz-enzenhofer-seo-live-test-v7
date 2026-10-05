
import type { Page } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'
import type { RobotsDirective } from '@/shared/robots.types'
import { listRow } from '@/shared/presentation/listRow'

// Shared presentation of the Googlebot robots rules (discover:indexable, discover:max-image-preview-large).
export const ROBOTS_META_SELECTOR = 'meta[name="robots" i], meta[name="googlebot" i]'
const ALL_CRAWLERS = 'all crawlers'
const INSTRUCTION_SEPARATOR = '; '

type HeaderPage = Pick<Page, 'headers' | 'responseHeaderFields'>
export const headersCaptured = (page: HeaderPage): boolean => page.headers !== undefined || page.responseHeaderFields !== undefined

/** The raw X-Robots-Tag header value(s) as one detail row; only when response headers were captured. */
export const xRobotsTagRow = (page: HeaderPage): DisplayField[] => {
  if (!headersCaptured(page)) return []
  const values = page.responseHeaderFields?.filter(([name]) => name.toLowerCase() === 'x-robots-tag').map(([, value]) => value)
    ?? Object.entries(page.headers || {}).filter(([name]) => name.toLowerCase() === 'x-robots-tag').map(([, value]) => value)
  return [textField('X-Robots-Tag', values.length ? listRow(values, 120, 0, INSTRUCTION_SEPARATOR) : 'Absent')]
}

/** Every applicable instruction value as one overview row, e.g. "index, follow; noarchive". */
export const instructionsRow = (directives: RobotsDirective[]): DisplayField =>
  textField('Instructions', listRow(directives.map(({ value }) => value), 60, 0, INSTRUCTION_SEPARATOR))

/** Per-element evidence of a robots meta tag: the crawler it addresses and its instruction. */
export const robotsMetaFields = (element: Element): DisplayField[] => {
  const name = (element.getAttribute('name') || '').trim().toLowerCase()
  return [textField('Crawler', name === 'robots' ? ALL_CRAWLERS : name), textField('Instruction', (element.getAttribute('content') || '').trim() || 'Empty')]
}

/** Whether this meta element carries an applicable noindex (or none) instruction. */
export const metaHasNoindex = (element: Element, directives: RobotsDirective[]): boolean => {
  const name = (element.getAttribute('name') || '').trim().toLowerCase()
  const content = (element.getAttribute('content') || '').trim()
  return directives.some((directive) => directive.source === 'meta' && directive.ua === name && directive.value === content && directive.hasNoindex)
}
