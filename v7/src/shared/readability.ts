// Shared helper to extract a readable main-content text without external deps.
// Content-root selection and the exclusion rules live in contentText.ts - this
// module only renders that same scope as one normalized string.
import { contentRoot, walkContentText } from './contentText'

export type ReadableContent = {
  text: string
  title?: string
  length: number
  source: 'main' | 'article' | 'body'
}

export const getReadableText = (doc: Document): ReadableContent => {
  const { root, source } = contentRoot(doc)
  const chunks: string[] = []
  walkContentText(root, (value) => chunks.push(value))
  const text = chunks.join(' ').replace(/\s+/g, ' ').trim()
  return {
    text,
    title: doc.title || '',
    length: text.length,
    source,
  }
}
