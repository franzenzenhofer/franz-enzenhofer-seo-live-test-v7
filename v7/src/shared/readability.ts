// Shared helper to extract a readable main-content text without external deps.
// Heuristic: prefer <main>, then <article>, otherwise fall back to body text.

export type ReadableContent = {
  text: string
  title?: string
  length: number
  source: 'main' | 'article' | 'body'
}

const pickContentRoot = (doc: Document): { el: Element | null; source: ReadableContent['source'] } => {
  const main = doc.querySelector('main')
  if (main) return { el: main, source: 'main' }
  const article = doc.querySelector('article')
  if (article) return { el: article, source: 'article' }
  return { el: doc.body, source: 'body' }
}

export const getReadableText = (doc: Document): ReadableContent => {
  const { el, source } = pickContentRoot(doc)
  const text = (el?.textContent || '').trim()
  return {
    text,
    title: doc.title || '',
    length: text.length,
    source,
  }
}
