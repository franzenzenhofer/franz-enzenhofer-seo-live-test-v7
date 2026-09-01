import type { FactBucket } from './domFacts.types'

export const CRITICAL_VALUE_LENGTH = 2048
const MAX_CRITICAL_ATTRIBUTES = 12

const CRITICAL_LINK_REL = /(canonical|alternate|amphtml|prev|next|manifest)/i

export const resourceUrlOf = (element: Element): string =>
  element.getAttribute('src') || element.getAttribute('href') || element.getAttribute('action') || element.getAttribute('data') || ''

export const isInsecureResource = (element: Element): boolean => resourceUrlOf(element).startsWith('http://')

/**
 * Elements a bounded audit may never drop: every head meta[name] is a possible
 * robots directive (see parseRobotsDirectives), canonical/hreflang drive
 * indexing rules, and any insecure http:// resource - src, href, form action,
 * or object data, in head or body - is the whole point of mixed-content.
 * Dropping one turns a rule's verdict into a false negative, so these bypass
 * the sampling limits.
 */
export const isCriticalFact = (element: Element, bucket: FactBucket): boolean => {
  const tag = element.tagName.toLowerCase()
  if (bucket === 'head') {
    if (tag === 'title' || tag === 'base') return true
    if (tag === 'meta') return element.hasAttributes()
    if (tag === 'link') return CRITICAL_LINK_REL.test(element.getAttribute('rel') || '') || isInsecureResource(element)
    return false
  }
  if (bucket === 'resource') return isInsecureResource(element)
  return false
}

/**
 * A critical fact whose attributes do not fit even the critical clamp is
 * corrupted evidence: rules judging the clamped value would judge the wrong
 * URL or directive, so the collector must flag critical truncation instead
 * of letting them run on it.
 */
export const criticalFactOverflows = (element: Element): boolean => {
  if (element.attributes.length > MAX_CRITICAL_ATTRIBUTES) return true
  for (let index = 0; index < element.attributes.length; index++) {
    const attribute = element.attributes.item(index)
    if (attribute && attribute.value.length > CRITICAL_VALUE_LENGTH) return true
  }
  return false
}
