import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const SPEC = 'https://developers.google.com/amp/cache/overview'

const findAmp = (d: Document) => {
  const el = d.querySelector('link[rel="amphtml"]')
  return { element: el, href: el?.getAttribute('href') || '' }
}

const ampCache = (href: string) => {
  try {
    const u = new URL(href)
    const host = u.host + u.pathname
    return u.protocol === 'https:'
      ? `https://cdn.ampproject.org/c/s/${host}`
      : `https://cdn.ampproject.org/c/${host}`
  } catch {
    return ''
  }
}

export const ampCacheUrlRule: Rule = {
  id: 'google:amp-cache-url',
  name: 'AMP Cache URL',
  enabled: true,
  what: 'static',
  async run(page) {
    const amp = findAmp(page.doc)
    if (!amp.href) {
      return {
        label: 'HEAD',
        message: 'No amphtml link',
        type: 'info',
        name: 'AMP Cache URL',
        details: { sourceHtml: '', snippet: '', tested: 'Checked for <link rel="amphtml">', reference: SPEC },
      }
    }

    const url = ampCache(amp.href)
    const sourceHtml = extractHtml(amp.element)

    return url
      ? {
          label: 'HEAD',
          message: `AMP Cache: ${url}`,
          type: 'info',
          name: 'AMP Cache URL',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(amp.element), reference: SPEC },
        }
      : {
          label: 'HEAD',
          message: 'AMP Cache not derivable',
          type: 'info',
          name: 'AMP Cache URL',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(amp.element), reference: SPEC },
        }
  },
}
