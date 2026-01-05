// HTML utility functions for extracting and formatting DOM elements
// Based on v2's RuleContext.js (nodeToString, partialCodeLink)

import { TRUNCATION_LIMITS } from './truncation-constants'

export const extractHtml = (element: Element | null): string => {
  if (!element) return ''
  const html = element.outerHTML
  if (html.length <= TRUNCATION_LIMITS.HTML_CONTENT) return html
  return html.slice(0, TRUNCATION_LIMITS.HTML_CONTENT) + '...[truncated]'
}

export const extractHtmlFromList = (elements: NodeListOf<Element> | Element[]): string => {
  if (!elements || elements.length === 0) return ''
  const raw = Array.from(elements).map(el => el.outerHTML).join('\n')
  if (raw.length <= TRUNCATION_LIMITS.HTML_CONTENT) return raw
  return raw.slice(0, TRUNCATION_LIMITS.HTML_CONTENT) + '...[truncated]'
}

export const extractSnippet = (html: string, maxChars = 100): string => {
  if (!html) return ''
  const trimmed = html.trim()
  if (trimmed.length <= maxChars) return trimmed
  return trimmed.substring(0, maxChars) + '...'
}

export const stripAttributesDeep = (element: Element | null): string => {
  if (!element) return ''
  const clone = element.cloneNode(true) as Element
  const clean = (node: Element) => {
    Array.from(node.attributes).forEach((attr) => node.removeAttribute(attr.name))
    Array.from(node.children).forEach((child) => {
      clean(child)
      const hasContent = child.textContent?.trim().length
      if (!hasContent && child.children.length === 0) child.remove()
    })
  }
  clean(clone)
  return clone.outerHTML
}

export const htmlEntitiesEncode = (str: string): string => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
