export const buildLinkedImageDetails = (elements: Element[], selectors: string[]) => {
  const html = elements.map((el) => el.outerHTML).join('\n')
  const snippet = html.trim()
  return snippet ? { snippet, sourceHtml: html, domPaths: selectors } : undefined
}

const normalizeSelector = (href: string | null | undefined, index: number) => {
  const cleanedHref = (href || '').trim().replace(/[\s"]/g, '')
  if (cleanedHref) return `a[href="${cleanedHref}"]`
  return `a:nth-of-type(${index + 1})`
}

export const evaluateLinkedImages = (page: { doc: Document }, predicate: (link: HTMLAnchorElement) => boolean, message: string) => {
  const links = Array.from(page.doc.querySelectorAll('a'))
  const failing: HTMLAnchorElement[] = []
  links.forEach((link) => {
    if (predicate(link)) return
    failing.push(link)
  })
  if (!failing.length) return null
  const selectors = failing.map((link, idx) => normalizeSelector(link.getAttribute('href'), idx))
  return { failing, selectors, message: `${failing.length} ${message}` }
}
