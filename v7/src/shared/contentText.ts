import { walkNodes } from './domFacts.walk'

const EXCLUDED = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT'])
export const CONTENT_TEXT_METHOD = 'Main, then article, then body text; script/style/template/noscript and hidden subtrees excluded. CSS visibility and consent access are not inferred.'

export const contentRoot = (doc: Document) => {
  const main = doc.querySelector('main')
  const article = doc.querySelector('article')
  return { root: main || article || doc.body, source: main ? 'main' : article ? 'article' : 'body' } as const
}

export const walkContentText = (root: Node | null, visit: (text: string) => void) => {
  const include = (node: Node) => node.nodeType !== 1 ||
    (!EXCLUDED.has((node as Element).tagName) && !(node as Element).hasAttribute('hidden'))
  if (!root || !include(root)) return
  walkNodes(root, (node) => { if (node.nodeType === 3) visit(node.nodeValue || '') }, include)
}

export const contentSummary = (doc: Document) => {
  const { root, source } = contentRoot(doc)
  let length = 0, hash = 2166136261, pendingSpace = false, excerpt = ''
  const append = (char: string) => {
    length++
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0
    if (excerpt.length < 160) excerpt += char
  }
  walkContentText(root, (text) => {
    for (const char of text) {
      if (/\s/.test(char)) pendingSpace = length > 0
      else {
        if (pendingSpace) append(' ')
        append(char)
        pendingSpace = false
      }
    }
    pendingSpace = length > 0
  })
  return { source, length, fingerprint: hash.toString(16), excerpt, method: CONTENT_TEXT_METHOD }
}
