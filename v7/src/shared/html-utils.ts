// HTML utility functions for extracting and formatting DOM elements
// Based on v2's RuleContext.js (nodeToString, partialCodeLink)

export const extractHtml = (element: Element | null): string => {
  if (!element) return ''
  return element.outerHTML
}

export const extractHtmlFromList = (elements: NodeListOf<Element> | Element[]): string => {
  if (!elements || elements.length === 0) return ''
  return Array.from(elements).map(el => el.outerHTML).join('\n')
}

export const extractSnippet = (html: string, maxChars = 100): string => {
  if (!html) return ''
  const trimmed = html.trim()
  if (trimmed.length <= maxChars) return trimmed
  return trimmed.substring(0, maxChars) + '...'
}

export const getDomPath = (element: Element | null): string => {
  if (!element) return ''

  const path: string[] = []
  let current: Element | null = element
  const ELEMENT_NODE = 1

  while (current && current.nodeType === ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase()

    if (current.id) {
      selector += `#${current.id}`
      path.unshift(selector)
      break
    }

    if (current.className) {
      const classes = current.className.trim().split(/\s+/).filter((c) => c)
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`
      }
    }

    const parent: Element | null = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter((sibling: Element) => sibling.nodeName === current!.nodeName)
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1
        selector += `:nth-of-type(${index})`
      }
    }

    path.unshift(selector)
    current = parent
  }

  return path.join(' > ')
}

export const htmlEntitiesEncode = (str: string): string => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}