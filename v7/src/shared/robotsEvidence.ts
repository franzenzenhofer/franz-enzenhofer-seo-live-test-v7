import type { RobotsDirective } from './robots.types'

export const robotsEvidence = (directives: RobotsDirective[]) => directives.map((directive) => ({
  crawler: directive.ua === 'robots' ? 'All crawlers (including Googlebot)' : directive.ua,
  foundIn: directive.source === 'meta' ? 'HTML meta tag' : 'HTTP response header',
  instruction: directive.value,
  ...(directive.sourceHtml ? { sourceHtml: directive.sourceHtml } : {}),
  ...(directive.headerKey ? { header: 'X-Robots-Tag' } : {}),
}))
