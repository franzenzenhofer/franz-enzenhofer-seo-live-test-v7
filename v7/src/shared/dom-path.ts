const escapeSelector = (value: string): string => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value)
  return value
    .replace(/^[0-9]/, (match) => `\\3${match} `)
    .replace(/[^a-zA-Z0-9_-]/g, '\\$&')
}

export const getDomPath = (element: Element | null): string => {
  if (!element) return ''

  const path: string[] = []
  let current: Element | null = element
  const ELEMENT_NODE = 1

  while (current && current.nodeType === ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase()

    const id = current.getAttribute('id')
    if (id) {
      selector += `#${escapeSelector(id)}`
      path.unshift(selector)
      break
    }

    const classAttr = current.getAttribute('class') || ''
    if (classAttr) {
      const classes = classAttr.trim().split(/\s+/).filter((c) => c)
      if (classes.length > 0) selector += `.${classes.map(escapeSelector).join('.')}`
    }

    const parent: Element | null = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter((sibling: Element) => sibling.nodeName === current!.nodeName)
      if (siblings.length > 1) selector += `:nth-of-type(${siblings.indexOf(current) + 1})`
    }

    path.unshift(selector)
    current = parent
  }

  return path.join(' > ')
}

export const getDomPaths = (elements: Element[]) =>
  elements.map((el) => getDomPath(el)).filter(Boolean)
