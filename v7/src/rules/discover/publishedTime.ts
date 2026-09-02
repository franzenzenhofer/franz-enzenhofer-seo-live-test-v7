import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { parseLd } from '@/shared/structured'

type DateResult = { published: string; modified: string; element: Element | null }

const findDates = (d: Document): DateResult => {
  const pubEl = d.querySelector('meta[property="article:published_time"]')
  const modEl = d.querySelector('meta[property="article:modified_time"]')

  let published = pubEl?.getAttribute('content') || ''
  let modified = modEl?.getAttribute('content') || ''
  let element: Element | null = pubEl || modEl

  const script = d.querySelector('script[type="application/ld+json"]')
  for (const node of parseLd(d)) {
    if (typeof node['datePublished'] === 'string' && !published) {
      published = node['datePublished']
      element = element || script
    }
    if (typeof node['dateModified'] === 'string' && !modified) {
      modified = node['dateModified']
      element = element || script
    }
  }
  return { published, modified, element }
}

export const discoverPublishedTimeRule: Rule = {
  id: 'discover:published-time',
  name: 'Published time',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/structured-data/article',
      'https://ogp.me/',
    ],
    description: 'Checks for a publish date via article:published_time/article:modified_time OG meta or JSON-LD datePublished/dateModified (ok if both, warn if either missing).',
  },
  async run(page) {
    const { published, modified, element } = findDates(page.doc)
    const sourceHtml = extractHtml(element)
    const baseDetails = {
      sourceHtml,
      snippet: extractSnippet(sourceHtml),
      domPath: getDomPath(element),
      datePublished: published || undefined,
      dateModified: modified || undefined,
    }

    if (!published) {
      return {
        label: 'DISCOVER',
        message: 'No published time (meta or LD+JSON)',
        type: 'warn',
        priority: 350,
        name: 'Published time',
        details: { ...baseDetails, is: 'datePublished missing', should: 'Add datePublished to article schema' },
      }
    }

    if (!modified) {
      return {
        label: 'DISCOVER',
        message: `Published: ${published} (dateModified missing)`,
        type: 'warn',
        priority: 450,
        name: 'Published time',
        details: { ...baseDetails, is: 'dateModified missing', should: 'Add dateModified to article schema' },
      }
    }

    return {
      label: 'DISCOVER',
      message: `Published: ${published}, Modified: ${modified}`,
      type: 'ok',
      priority: 800,
      name: 'Published time',
      details: baseDetails,
    }
  },
}
