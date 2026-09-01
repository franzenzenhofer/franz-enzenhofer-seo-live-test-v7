import type { DomElementFact, FactBucket } from './domFacts.types'

export type { FactBucket }

const MAX_ATTRIBUTES = 12
const MAX_VALUE_LENGTH = 512
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

const CRITICAL_LINK_REL = /(canonical|alternate|amphtml|prev|next|manifest)/i

/**
 * Elements a bounded audit may never drop: every head meta[name] is a possible
 * robots directive (see parseRobotsDirectives), canonical/hreflang drive
 * indexing rules, and an insecure resource is the whole point of mixed-content.
 * Dropping one turns a rule's verdict into a false negative, so these bypass
 * the sampling limits.
 */
export const isCriticalFact = (element: Element, bucket: FactBucket): boolean => {
  const tag = element.tagName.toLowerCase()
  if (bucket === 'head') {
    if (tag === 'title' || tag === 'base') return true
    if (tag === 'meta') return element.hasAttributes()
    if (tag === 'link') return CRITICAL_LINK_REL.test(element.getAttribute('rel') || '')
    return false
  }
  if (bucket === 'resource') {
    const url = element.getAttribute('src') || element.getAttribute('href') || element.getAttribute('action') || ''
    return url.startsWith('http://')
  }
  return false
}
