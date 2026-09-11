const MAX_EXAMPLES = 10

const normalizeSelector = (href: string | null | undefined, index: number) => {
  const cleanedHref = (href || '').trim().replace(/[\s"]/g, '')
  if (cleanedHref) return `a[href="${cleanedHref}"]`
  return `a:nth-of-type(${index + 1})`
}

export const evaluateLinkedImages = (page: { doc: Document }, predicate: (link: HTMLAnchorElement) => boolean, message: string) => {
  const links = page.doc.querySelectorAll('a')
  const failing: HTMLAnchorElement[] = []
  let total = 0
  links.forEach((link) => {
    if (predicate(link)) return
    total++
    if (failing.length < MAX_EXAMPLES) failing.push(link)
  })
  if (!total) return null
  const selectors = failing.map((link, idx) => normalizeSelector(link.getAttribute('href'), idx))
  return { failing, selectors, total, message: `${total} ${message}` }
}
