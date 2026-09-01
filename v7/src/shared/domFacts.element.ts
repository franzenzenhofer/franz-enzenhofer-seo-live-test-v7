import { CRITICAL_VALUE_LENGTH, isInsecureResource } from './domFacts.critical'
import type { DomElementFact, FactBucket } from './domFacts.types'

export type { FactBucket }
export { isCriticalFact } from './domFacts.critical'

const MAX_ATTRIBUTES = 12
const MAX_VALUE_LENGTH = 512
const HEAD_TAGS = new Set(['base', 'link', 'meta', 'title'])
const RESOURCE_TAGS = new Set(['audio', 'embed', 'form', 'iframe', 'img', 'object', 'script', 'source', 'video'])

export const attributesOf = (element: Element | null, maxValueLength = MAX_VALUE_LENGTH): Array<[string, string]> => {
  if (!element) return []
  const attributes: Array<[string, string]> = []
  for (let index = 0; index < Math.min(element.attributes.length, MAX_ATTRIBUTES); index++) {
    const attribute = element.attributes.item(index)
    if (attribute) attributes.push([attribute.name, attribute.value.slice(0, maxValueLength)])
  }
  return attributes
}

export const factBucket = (element: Element, doc: Document): FactBucket | null => {
  const tag = element.tagName.toLowerCase()
  if (doc.head?.contains(element) && HEAD_TAGS.has(tag)) return 'head'
  if (tag === 'a') return 'anchor'
  if (RESOURCE_TAGS.has(tag)) return 'resource'
  // A <link> outside <head> can still load a resource (stylesheet, preload).
  // Secure ones decide no verdict, but an insecure one is mixed-content
  // evidence and must reach the resource bucket instead of vanishing.
  if (tag === 'link' && isInsecureResource(element)) return 'resource'
  return null
}

export const elementFact = (element: Element, doc: Document, critical = false): DomElementFact => {
  const tag = element.tagName.toLowerCase()
  const text = tag === 'title' ? (element.textContent || '').slice(0, MAX_VALUE_LENGTH) : undefined
  return {
    location: doc.head?.contains(element) ? 'head' : 'body',
    tag,
    attrs: attributesOf(element, critical ? CRITICAL_VALUE_LENGTH : MAX_VALUE_LENGTH),
    ...(text ? { text } : {}),
  }
}
