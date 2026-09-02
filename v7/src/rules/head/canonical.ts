import type { Rule } from '@/core/types'
import { extractHtml, extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPath, getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'
import { isAbsoluteUrl, normalizeUrl } from '@/shared/url-utils'

const LABEL = 'HEAD'
const NAME = 'Canonical Link'

// Self-reference comparison must keep the query string: parameters can change
// content (Google url-structure guidance), so /a?x=1 vs /a?x=2 is NOT a self
// reference even though the shared normalizeUrl equates them.
export const canonicalRule: Rule = {
  id: 'head-canonical',
  name: 'Canonical Link',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      'https://www.rfc-editor.org/rfc/rfc6596',
      'https://developers.google.com/search/docs/crawling-indexing/url-structure',
    ],
    description: 'Checks the rel=canonical link element: presence, uniqueness, in-<head> placement, non-empty href, no fragment, absolute URL, and whether it self-references the page URL.',
  },
  run: async (page) => {
    const elements = sampleElements(page.doc.querySelectorAll<HTMLLinkElement>('link[rel~="canonical" i]'))
    const count = elements.total

    if (count === 0) {
      return { label: LABEL, message: 'No canonical link found in <head>.', type: 'warn', name: NAME, priority: 400, details: { canonicalUrl: null, count } }
    }

    if (count > 1) {
      const sourceHtml = extractHtmlFromList(elements.sample)
      return {
        label: LABEL,
        message: `Multiple canonical tags found (${count}); keep exactly one.`,
        type: 'error',
        priority: 200,
        name: NAME,
        details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPaths: getDomPaths(elements.sample), hrefs: elements.sample.map((el) => (el.getAttribute('href') || '').trim()), count, shown: elements.shown, truncated: elements.truncated },
      }
    }

    const el = elements.sample[0]!
    const sourceHtml = extractHtml(el)
    const href = (el.getAttribute('href') || '').trim()
    if (!el.closest('head')) {
      return {
        label: LABEL,
        message: 'Canonical link is outside <head>; move it into <head>.',
        type: 'warn',
        priority: 250,
        name: NAME,
        details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), href },
      }
    }

    if (!href) {
      return {
        label: LABEL,
        message: 'Canonical link has an empty href.',
        type: 'warn',
        priority: 300,
        name: NAME,
        details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), href, count },
      }
    }

    try {
      if (href.includes('#')) {
        return {
          label: LABEL,
          message: 'Canonical URL contains a fragment; remove the fragment.',
          type: 'warn',
          priority: 250,
          name: NAME,
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), href, count },
        }
      }

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
          canonicalUrl: resolvedUrl,
          normalizedPageUrl,
          normalizedCanonicalUrl,
          matchesPageUrl,
          isAbsolute,
          count,
        },
      }
    } catch {
      return {
        label: LABEL,
        message: `Invalid canonical URL: ${href}`,
        type: 'warn',
        priority: 150,
        name: NAME,
        details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(el), href, count },
      }
    }
  },
}
