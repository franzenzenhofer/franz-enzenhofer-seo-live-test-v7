import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const SPEC = 'https://developers.google.com/search/docs/appearance/structured-data/article#datepublished'

type DateResult = { published: string; modified: string; element: Element | null }

const findDates = (d: Document): DateResult => {
  const pubEl = d.querySelector('meta[property="article:published_time"]')
  const modEl = d.querySelector('meta[property="article:modified_time"]')

  let published = pubEl?.getAttribute('content') || ''
  let modified = modEl?.getAttribute('content') || ''
  let element: Element | null = pubEl || modEl

  const scripts = Array.from(d.querySelectorAll('script[type="application/ld+json"]'))
  for (const s of scripts) {
    try {
      const j = JSON.parse(s.textContent || 'null')
      const arr = Array.isArray(j) ? j : [j]
      for (const it of arr) {
        if (it && typeof it['datePublished'] === 'string' && !published) {
          published = it['datePublished']
          element = element || s
        }
        if (it && typeof it['dateModified'] === 'string' && !modified) {
          modified = it['dateModified']
          element = element || s
        }
      }
    } catch {
      /* ignore */
    }
  }
  return { published, modified, element }
}

export const discoverPublishedTimeRule: Rule = {
  id: 'discover:published-time',
  name: 'Published time',
  enabled: true,
  what: 'static',
  async run(page) {
    const { published, modified, element } = findDates(page.doc)
    const sourceHtml = extractHtml(element)
    const baseDetails = {
      sourceHtml,
      snippet: extractSnippet(sourceHtml),
      domPath: getDomPath(element),
      reference: SPEC,
      datePublished: published || undefined,
      dateModified: modified || undefined,
    }

    if (!published) {
      return {
        label: 'DISCOVER',
        message: 'No published time (meta or LD+JSON)',
        type: 'warn',
        name: 'Published time',
        details: { ...baseDetails, is: 'datePublished missing', should: 'Add datePublished to article schema' },
      }
    }

    if (!modified) {
      return {
        label: 'DISCOVER',
        message: `Published: ${published} (dateModified missing)`,
        type: 'warn',
        name: 'Published time',
        details: { ...baseDetails, is: 'dateModified missing', should: 'Add dateModified to article schema' },
      }
    }

    return {
      label: 'DISCOVER',
      message: `Published: ${published}, Modified: ${modified}`,
      type: 'ok',
      name: 'Published time',
      details: baseDetails,
    }
  },
}
