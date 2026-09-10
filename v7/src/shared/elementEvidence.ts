import { getDomPath } from './dom-path'
import { extractHtml } from './html-utils'

/** A recognizable element with its exact source, for human-readable result lists. */
export const elementEvidence = (element: Element) => {
  const url = element.getAttribute('src') || element.getAttribute('href') || ''
  const name = element.getAttribute('alt')?.trim() || element.getAttribute('aria-label')?.trim()
    || element.getAttribute('title')?.trim() || element.getAttribute('id')?.trim()
    || (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160)
    || url.split('/').pop()?.split('?')[0] || element.tagName.toLowerCase()
  return { name, ...(url ? { url } : {}), domPath: getDomPath(element), sourceHtml: extractHtml(element) }
}
