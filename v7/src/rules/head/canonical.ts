import type { Rule } from '@/core/types'
import { extractHtml, extractHtmlFromList, extractSnippet, getDomPath } from '@/shared/html-utils'
import { isAbsoluteUrl, normalizeUrl } from '@/shared/url-utils'

const LABEL = 'HEAD'
const NAME = 'Canonical Link'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'

export const canonicalRule: Rule = {
  id: 'head-canonical',
  name: 'Canonical Link',
  enabled: true,
  what: 'static',
  run: async (page) => {
    const elements = Array.from(page.doc.querySelectorAll('link[rel~="canonical" i]')) as HTMLLinkElement[]
    const count = elements.length

    if (count === 0) {
      return {
        label: LABEL,
        message: 'No canonical link found in <head>.',
        type: 'warn',
        name: NAME,
        priority: 400,
        details: { reference: SPEC, canonicalUrl: null, count },
      }
    }

    if (count > 1) {
      const sourceHtml = extractHtmlFromList(elements)
      return {
        label: LABEL,
        message: `Multiple canonical tags found (${count}); keep exactly one.`,
        type: 'error',
        priority: 200,
        name: NAME,
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPaths: elements.map((_, idx) => `link[rel~="canonical" i]:nth-of-type(${idx + 1})`),
          hrefs: elements.map((el) => (el.getAttribute('href') || '').trim()),
          reference: SPEC,
          count,
        },
      }
    }

    const el = elements[0] as HTMLLinkElement
    const sourceHtml = extractHtml(el)
    const href = (el.getAttribute('href') || '').trim()
    if (!href) {
      return {
        label: LABEL,
        message: 'Canonical link has an empty href.',
        type: 'warn',
        priority: 300,
        name: NAME,
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPath: getDomPath(el),
          href,
          reference: SPEC,
          count,
        },
      }
    }

    try {
      const resolvedUrl = new URL(href, page.url).toString()
      const isAbsolute = isAbsoluteUrl(href)
      const normalizedPageUrl = normalizeUrl(page.url)
      const normalizedCanonicalUrl = normalizeUrl(resolvedUrl)
      const matchesPageUrl = normalizedPageUrl === normalizedCanonicalUrl

      let message = ''
      let type: 'ok' | 'warn' = 'warn'
      let priority = 500

      if (!isAbsolute) {
        message = `Canonical is relative; resolved to ${resolvedUrl}.`
        type = 'warn'
        priority = 300
      } else if (matchesPageUrl) {
        message = 'Canonical self-references the current URL.'
        type = 'ok'
        priority = 850
      } else {
        message = `Canonical points to ${resolvedUrl}.`
      }

      return {
        label: LABEL,
        message,
        type,
        priority,
        name: NAME,
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPath: getDomPath(el),
          href,
          resolvedUrl,
          normalizedPageUrl,
          normalizedCanonicalUrl,
          matchesPageUrl,
          isAbsolute,
          count,
          reference: SPEC,
        },
      }
    } catch {
      return {
        label: LABEL,
        message: `Invalid canonical URL: ${href}`,
        type: 'warn',
        priority: 150,
        name: NAME,
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPath: getDomPath(el),
          href,
          reference: SPEC,
          count,
        },
      }
    }
  },
}
