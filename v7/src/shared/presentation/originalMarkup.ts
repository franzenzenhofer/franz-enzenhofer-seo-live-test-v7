import { originalField, textField } from './create'
import type { DisplayField } from './schema'

import { getDomPath } from '@/shared/dom-path'

const reconstructed = new WeakSet<Document>()
const originals = new WeakMap<Element, { html: string; selector: string }>()
export const markReconstructed = (doc: Document) => { reconstructed.add(doc) }
export const registerOriginal = (element: Element, original: { html: string; selector: string }) => { originals.set(element, original) }

// Preflight before native serialization; reject large or opaque subtrees in full.
const smallEnough = (element: Element) => {
  const pending: Node[] = [element]
  let size = 0, nodes = 0
  while (pending.length) {
    const node = pending.pop()!
    if (++nodes > 512) return false
    size += (node.nodeValue?.length || 0) * 6
    if (node.nodeType === 1) {
      const el = node as Element
      if (el.tagName.toLowerCase() === 'template') return false
      size += el.tagName.length * 2 + 5
      for (const attr of Array.from(el.attributes)) size += (attr.name.length + attr.value.length) * 6 + 4
    }
    if (size > 8_000 || pending.length + node.childNodes.length > 512) return false
    pending.push(...Array.from(node.childNodes))
  }
  return true
}
export const readOriginalMarkup = (element: Element) => {
  const original = originals.get(element)
  if (original) return original
  if (reconstructed.has(element.ownerDocument) || !smallEnough(element)) return null
  return { html: element.outerHTML, selector: getDomPath(element) }
}
export const markupEvidence = (elements: Element[], label = 'Markup') => {
  const markup: Array<Extract<DisplayField, { kind: 'original' }>> = []
  const fields: DisplayField[] = []
  const selectors: Array<string | null> = []
  for (const [index, element] of elements.entries()) {
    const captured = readOriginalMarkup(element)
    const selector = captured?.selector ?? (reconstructed.has(element.ownerDocument) ? null : getDomPath(element))
    selectors.push(selector)
    if (captured) {
      markup.push(originalField(`${label} ${index + 1}`, captured.html))
    } else fields.push(textField(`${label} ${index + 1}`, 'Complete original markup not retained'))
    if (selector) fields.push(textField(`Selector ${index + 1}`, selector))
  }
  return { markup, fields, selectors }
}
