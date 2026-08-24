import type { DomElementFact } from './domFacts.types'

const MAX_ATTRIBUTES = 20
const MAX_VALUE_LENGTH = 2_048
const HEAD_TAGS = new Set(['base', 'link', 'meta', 'title'])
const RESOURCE_TAGS = new Set(['audio', 'embed', 'form', 'iframe', 'img', 'object', 'script', 'source', 'video'])

const clamp = (value: string) => value.slice(0, MAX_VALUE_LENGTH)

export const attributesOf = (element: Element | null): Array<[string, string]> => {
  if (!element) return []
  const attributes: Array<[string, string]> = []
  for (let index = 0; index < Math.min(element.attributes.length, MAX_ATTRIBUTES); index++) {
    const attribute = element.attributes.item(index)
    if (attribute) attributes.push([attribute.name, clamp(attribute.value)])
  }
  return attributes
}

export type FactBucket = 'head' | 'anchor' | 'resource'

export const factBucket = (element: Element, doc: Document): FactBucket | null => {
  const tag = element.tagName.toLowerCase()
  if (doc.head?.contains(element) && HEAD_TAGS.has(tag)) return 'head'
  if (tag === 'a') return 'anchor'
  if (RESOURCE_TAGS.has(tag)) return 'resource'
  return null
}

export const elementFact = (element: Element, doc: Document): DomElementFact => {
  const tag = element.tagName.toLowerCase()
  const text = tag === 'title' ? clamp(element.textContent || '') : undefined
  return {
    location: doc.head?.contains(element) ? 'head' : 'body',
    tag,
    attrs: attributesOf(element),
    ...(text ? { text } : {}),
  }
}
