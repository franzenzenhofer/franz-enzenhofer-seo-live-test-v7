const MAX_EXAMPLES = 3
const MAX_SNIPPET_CHARS = 600

const clampSnippet = (html: string) => (html.length > MAX_SNIPPET_CHARS ? `${html.slice(0, MAX_SNIPPET_CHARS)}…` : html)

export const buildLinkedImageDetails = (elements: Element[], selectors: string[]) => {
  const preview = elements.slice(0, MAX_EXAMPLES)
  const html = preview.map((el) => el.outerHTML).join('\n\n')
  const snippet = clampSnippet(html.trim())
  const omitted = Math.max(elements.length - preview.length, 0)
  const note = omitted ? `${snippet}\n\n…${omitted} more linked images omitted` : snippet
  return snippet
    ? {
        snippet: note,
        sourceHtml: note,
        domPaths: selectors.slice(0, preview.length),
        count: elements.length,
        sampleCount: preview.length,
      }
    : undefined
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
