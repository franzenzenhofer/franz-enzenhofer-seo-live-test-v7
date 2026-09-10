import type { Rule } from '@/core/types'
import { extractHtml } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { normalizeUrl } from '@/shared/url-utils'
import { linkHeaderOf, parseHeaderCanonicals } from '@/shared/canonicalHeader'

const resolve = (value: string, base: string): string => {
  try { return value ? new URL(value, base).href : '' } catch { return '' }
}
export const canonicalSignalsConflictRule: Rule = {
  id: 'head:canonical-signals-conflict', name: 'HTML and HTTP canonical agreement', enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls', 'https://www.rfc-editor.org/rfc/rfc6596'],
    description: 'Compares the first HTML and HTTP canonical declarations, identifies each source and distinguishes absence from agreement or conflict.',
    userGuide: {
      check: 'A canonical declaration suggests which URL should represent duplicate content in search. This compares the first HTML tag and HTTP Link header; Google’s actual canonical choice is not checked.',
      action: 'Choose the intended preferred URL and make both declarations consistent. Edit the HTML template or SEO plugin for the tag, and the server or CDN configuration for the HTTP Link header. Using one method reduces maintenance risk.',
    },
  },
  async run(page) {
    const element = page.doc.querySelector('link[rel~="canonical" i]')
    const htmlHref = (element?.getAttribute('href') || '').trim()
    const header = linkHeaderOf(page.headers)
    const headerHref = parseHeaderCanonicals(header)[0] || ''
    const htmlCanonical = resolve(htmlHref, page.url)
    const headerCanonical = resolve(headerHref, page.url)
    const sources = [{ foundIn: 'HTML canonical tag', declaredUrl: htmlHref, resolvedUrl: htmlCanonical },
      { foundIn: 'HTTP Link header', declaredUrl: headerHref, resolvedUrl: headerCanonical }].filter(({ declaredUrl }) => declaredUrl)
    const invalid = sources.some(({ resolvedUrl }) => !resolvedUrl || !/^https?:\/\//i.test(resolvedUrl))
    const both = Boolean(htmlCanonical && headerCanonical)
    const matches = both && normalizeUrl(htmlCanonical) === normalizeUrl(headerCanonical)
    const message = invalid ? 'A canonical declaration has an invalid or unsupported URL; agreement could not be checked.'
      : !sources.length ? 'Neither an HTML nor an HTTP canonical declaration was found.'
        : !both ? `Only the ${htmlCanonical ? 'HTML tag' : 'HTTP header'} declares a canonical URL; there is no second source to compare.`
          : matches ? 'HTML and HTTP canonicals agree; choose one method to reduce maintenance risk.'
            : 'HTML and HTTP canonicals point to different URLs.'
    return {
      label: 'HEAD', name: 'HTML and HTTP canonical agreement', message,
      type: invalid || matches ? 'warn' : both ? 'error' : 'info', priority: both && !matches ? 80 : 700,
      details: {
        ...(sources.length ? { canonicalSources: sources } : {}),
        interpretation: matches ? 'Matching declarations are supported. This is a maintenance recommendation, not a conflicting URL finding.'
          : both ? 'The two declarations send different preferred-URL signals. The sources below show exactly what disagrees.'
            : 'This comparison needs two declarations. Missing declarations are covered by the separate canonical presence checks.',
        ...(element ? { sourceHtml: extractHtml(element), domPath: getDomPath(element) } : {}),
        ...(header ? { header } : {}),
      },
    }
  },
}
