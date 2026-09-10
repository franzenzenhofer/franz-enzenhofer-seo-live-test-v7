import type { Page } from '@/core/types'

/** Resolve authored web links against the first document base, then the page URL. */
export const resolvePageWebUrl = (href: string, page: Pick<Page, 'doc' | 'url'>): string | null => {
  if (!href.trim()) return null
  let base = page.url
  const declaredBase = page.doc.querySelector('base[href]')?.getAttribute('href')
  if (declaredBase) {
    try { base = new URL(declaredBase, page.url).href } catch { /* Invalid base leaves the page URL in effect. */ }
  }
  try {
    const url = new URL(href, base || undefined)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch { return null }
}
