import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const findAmp = (d: Document) => {
  const el = d.querySelector('link[rel="amphtml"]')
  return { element: el, href: el?.getAttribute('href') || '' }
}

// Per the AMP cache-URL spec: every dash becomes a double dash, every dot a
// dash, forming the publisher subdomain of cdn.ampproject.org.
const ampCache = (href: string) => {
  try {
    const u = new URL(href)
    const subdomain = u.hostname.replace(/-/g, '--').replace(/\./g, '-')
    const secure = u.protocol === 'https:' ? 's/' : ''
    return `https://${subdomain}.cdn.ampproject.org/c/${secure}${u.host}${u.pathname}${u.search}`
  } catch {
    return ''
  }
}

export const ampCacheUrlRule: Rule = {
  id: 'google:amp-cache-url',
  name: 'AMP Cache URL',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: ['https://amp.dev/documentation/guides-and-tutorials/learn/amp-caches-and-cors/amp-cache-urls/'],
    description: 'Derives the Google AMP Cache URL (publisher subdomain of cdn.ampproject.org, /c/[s/]host/path?query) from the page\'s link rel=amphtml href.',
  },
  async run(page) {
    const amp = findAmp(page.doc)
    if (!amp.href) {
      return {
        label: 'HEAD',
        message: 'No amphtml link - AMP Cache URL not applicable.',
        type: 'info',
        priority: 950,
        name: 'AMP Cache URL',
        details: { tested: 'Checked for <link rel="amphtml"> (presence itself is graded by head:amphtml).' },
      }
    }

    const url = ampCache(amp.href)
    const sourceHtml = extractHtml(amp.element)

    return url
      ? {
          label: 'HEAD',
          message: 'AMP Cache URL derived from amphtml link.',
          type: 'info',
          priority: 700,
          name: 'AMP Cache URL',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(amp.element), href: amp.href, ampCacheUrl: url },
        }
      : {
          label: 'HEAD',
          message: 'AMP Cache URL not derivable from the amphtml href.',
          type: 'warn',
          priority: 400,
          name: 'AMP Cache URL',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(amp.element), href: amp.href },
        }
  },
}
