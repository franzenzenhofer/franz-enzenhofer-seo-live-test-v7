// HTML utility functions for extracting and formatting DOM elements
// Based on v2's RuleContext.js (nodeToString, partialCodeLink)

import { TRUNCATION_LIMITS } from './truncation-constants'
import { boundedOuterHtml, boundedTextHtml } from './boundedHtml'

export const extractHtml = (element: Element | null): string => {
  const html = boundedOuterHtml(element, TRUNCATION_LIMITS.HTML_CONTENT)
  return html.length < TRUNCATION_LIMITS.HTML_CONTENT ? html : `${html}...[truncated]`
}

export const extractHtmlFromList = (elements: NodeListOf<Element> | Element[]): string => {
  if (!elements || elements.length === 0) return ''
  let raw = ''
  for (let index = 0; index < elements.length; index++) {
    const element = elements[index]
    if (!element) continue
    const remaining = TRUNCATION_LIMITS.HTML_CONTENT - raw.length
    if (remaining <= 1) break
    raw += `${raw ? '\n' : ''}${boundedOuterHtml(element, remaining)}`
  }
  return raw.length < TRUNCATION_LIMITS.HTML_CONTENT ? raw : `${raw}...[truncated]`
}

export const joinHtmlFragments = (fragments: string[]): string => {
  if (!fragments || fragments.length === 0) return ''
  const raw = fragments.join('\n')
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
  return boundedTextHtml(element, TRUNCATION_LIMITS.SNIPPET)
}

export const htmlEntitiesEncode = (str: string): string => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
