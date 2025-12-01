// Moved to trash on 2025-11-26: unused page info extractor; message path removed.
import type { PageInfoT } from './schemas'

const text = (s: string) => s.trim().slice(0, 500)

const sel = (q: string) => document.querySelector(q)

export const getMeta = (name: string) => {
  const el = sel(`meta[name="${name}"]`) as HTMLMetaElement | null
  return el?.content?.trim() || ''
}

export const getCanonical = () => {
  const el = sel('link[rel="canonical"]') as HTMLLinkElement | null
  return el?.href
}

export const extractPageInfo = (): PageInfoT => ({
  url: location.href,
  title: text(document.title || ''),
  description: text(getMeta('description')),
  canonical: getCanonical(),
})
